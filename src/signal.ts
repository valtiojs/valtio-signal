/// <reference types="react/experimental" />

import ReactExports from 'react';
import { snapshot, subscribe } from 'valtio/vanilla';
import type { INTERNAL_Snapshot as Snapshot } from 'valtio/vanilla';
import { createProxy, isChanged } from 'proxy-compare';
import { createReactSignals } from 'create-react-signals';

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
type SetValue = (path: unknown[], value: unknown) => void;

const EMPTY = Symbol();

const createSignal = <T extends object>(
  proxyObject: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _scope: object,
): [Subscribe, GetValue, SetValue] => {
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
  const set: SetValue = (path, value) => {
    let current: any = proxyObject;
    for (let i = 0; i < path.length - 1; ++i) {
      current = current[path[i] as string | symbol];
    }
    current[path[path.length - 1] as string | symbol] = value;
  };
  return [sub, get, set];
};

const VALUE_PROP = Symbol();

export const getValueProp = <T extends { value: unknown }>(
  x: AttachValue<T>,
): AttachValue<T['value']> => (x as any)[VALUE_PROP];

const { getSignal, createElement } = createReactSignals(
  createSignal,
  'value',
  VALUE_PROP,
  use,
);

export { createElement };

type AttachValue<T> = T & { value: T } & {
  [K in keyof T]: AttachValue<T[K]>;
};

const defaultScope = {};

export function $<T extends object>(
  proxyObject: T,
  scope?: object,
): AttachValue<Snapshot<T>>;

export function $<T extends object>(proxyObject: T, scope = defaultScope) {
  return getSignal(proxyObject, scope);
}
