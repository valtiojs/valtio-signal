/// <reference types="react/experimental" />

import ReactExports, {
  createElement as createElementOrig,
  useEffect,
  useReducer,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { snapshot, subscribe } from 'valtio/vanilla';
import type { INTERNAL_Snapshot as Snapshot } from 'valtio/vanilla';
import { createProxy, isChanged } from 'proxy-compare';

const use =
  ReactExports.use ||
  (<T>(
    promise: Promise<T> & {
      status?: 'pending' | 'fulfilled' | 'rejected';
      value?: T;
      reason?: unknown;
    },
  ): T => {
    if (promise.status === 'pending') {
      throw promise;
    } else if (promise.status === 'fulfilled') {
      return promise.value as T;
    } else if (promise.status === 'rejected') {
      throw promise.reason;
    } else {
      promise.status = 'pending';
      promise.then(
        (v) => {
          promise.status = 'fulfilled';
          promise.value = v;
        },
        (e) => {
          promise.status = 'rejected';
          promise.reason = e;
        },
      );
      throw promise;
    }
  });

type Unsubscribe = () => void;
type Subscribe = (callback: () => void) => Unsubscribe;
type GetValue = () => unknown;

const SIGNAL = Symbol('VALTIO_SIGNAL');
type Signal = {
  [SIGNAL]: { sub: Subscribe; get: GetValue };
};
const isSignal = (x: unknown): x is Signal => !!(x as any)?.[SIGNAL];

const createSignal = (sub: Subscribe, get: GetValue): Signal => {
  const sig = new Proxy(
    (() => {
      // empty
    }) as any,
    {
      get(_target, prop) {
        if (prop === SIGNAL) {
          return { sub, get };
        }
        return createSignal(sub, () => {
          const obj = get() as any;
          if (typeof obj[prop] === 'function') {
            return obj[prop].bind(obj);
          }
          return obj[prop];
        });
      },
      apply(_target, _thisArg, args) {
        return createSignal(sub, () => {
          const fn = get() as any;
          return fn(...args);
        });
      },
    },
  );
  return sig;
};

const scopeCacheCache = new WeakMap<object, WeakMap<object, Signal>>();

const EMPTY = Symbol();

const getProxySignal = <T extends object>(
  scope: object,
  proxyObject: T,
): Signal => {
  let proxySignalCache = scopeCacheCache.get(scope);
  if (!proxySignalCache) {
    proxySignalCache = new WeakMap();
    scopeCacheCache.set(scope, proxySignalCache);
  }
  let sig = proxySignalCache.get(proxyObject);
  if (!sig) {
    const proxyCache = new WeakMap();
    let snap = EMPTY as unknown | typeof EMPTY;
    let affected = new WeakMap();
    const listeners = new Set<() => void>();
    let unsubscribe: (() => void) | undefined;
    const addListener = (listener: () => void) => {
      if (!unsubscribe) {
        unsubscribe = subscribe(proxyObject, () => {
          try {
            const nextSnap = snapshot(proxyObject);
            if (
              snap !== EMPTY &&
              !isChanged(snap, nextSnap, affected, new WeakMap())
            ) {
              // not changed
              return;
            }
          } catch (e) {
            // ignore if a promise or something is thrown
          }
          snap = EMPTY;
          affected = new WeakMap();
          listeners.forEach((l) => l());
        });
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (!listeners.size && unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
      };
    };
    const sub: Subscribe = (callback) => addListener(callback);
    const get: GetValue = () => {
      if (snap === EMPTY) {
        snap = snapshot(
          proxyObject,
          // HACK this could violate the rule of using `use`.
          use,
        );
      }
      return createProxy(snap, affected, proxyCache);
    };
    sig = createSignal(sub, get);
    proxySignalCache.set(proxyObject, sig);
  }
  return sig;
};

const subscribeSignal = (sig: Signal, callback: () => void) => {
  return sig[SIGNAL].sub(callback);
};

const readSignal = (sig: Signal) => {
  return sig[SIGNAL].get();
};

const defaultScope = {};

export function $<T extends object>(
  proxyObject: T,
  scope = defaultScope,
): Snapshot<T> {
  return getProxySignal(scope, proxyObject) as Signal & Snapshot<T>; // HACK lie type
}

// functions for jsx-runtime

const useMemoList = <T>(list: T[], compareFn = (a: T, b: T) => a === b) => {
  const [state, setState] = useState(list);
  const listChanged =
    list.length !== state.length ||
    list.some((arg, index) => !compareFn(arg, state[index] as T));
  if (listChanged) {
    // schedule update, triggers re-render
    setState(list);
  }
  return listChanged ? list : state;
};

const Rerenderer = ({
  signals,
  render,
}: {
  signals: Signal[];
  render: () => ReactNode;
}): ReactNode => {
  const [, rerender] = useReducer((c) => c + 1, 0);
  const memoedSignals = useMemoList(signals);
  useEffect(() => {
    const unsubs = memoedSignals.map((sig) => subscribeSignal(sig, rerender));
    return () => unsubs.forEach((unsub) => unsub());
  }, [memoedSignals]);
  return render();
};

const findAllSignals = (x: unknown): Signal[] => {
  if (isSignal(x)) {
    return [x];
  }
  if (Array.isArray(x)) {
    return x.flatMap(findAllSignals);
  }
  if (typeof x === 'object' && x !== null) {
    return Object.values(x).flatMap(findAllSignals);
  }
  return [];
};

const fillAllSignalValues = <T>(x: T): T => {
  if (isSignal(x)) {
    return readSignal(x) as T;
  }
  if (Array.isArray(x)) {
    let changed = false;
    const x2 = x.map((item) => {
      const item2 = fillAllSignalValues(item);
      if (item !== item2) {
        changed = true; // HACK side effect
      }
      return item2;
    });
    return changed ? (x2 as typeof x) : x;
  }
  if (typeof x === 'object' && x !== null) {
    let changed = false;
    const x2 = Object.fromEntries(
      Object.entries(x).map(([key, value]) => {
        const value2 = fillAllSignalValues(value);
        if (value !== value2) {
          changed = true; // HACK side effect
        }
        return [key, value2];
      }),
    );
    return changed ? (x2 as typeof x) : x;
  }
  return x;
};

export const createElement = ((type: any, props?: any, ...children: any[]) => {
  const signalsInChildren = children.flatMap((child) =>
    isSignal(child) ? [child] : [],
  );
  const signalsInProps = findAllSignals(props);
  if (!signalsInChildren.length && !signalsInProps.length) {
    return createElementOrig(type, props, ...children);
  }
  const getChildren = () =>
    signalsInChildren.length
      ? children.map((child) => (isSignal(child) ? readSignal(child) : child))
      : children;
  const getProps = () =>
    signalsInProps.length ? fillAllSignalValues(props) : props;
  return createElementOrig(Rerenderer as any, {
    signals: [...signalsInChildren, ...signalsInProps],
    render: () => createElementOrig(type, getProps(), ...getChildren()),
  });
}) as typeof createElementOrig;
