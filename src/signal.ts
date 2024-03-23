/// <reference types="react/canary" />

import ReactExports from 'react';
import { snapshot, subscribe } from 'valtio/vanilla';
import type { Snapshot } from 'valtio/vanilla';
import { createReactSignals } from 'create-react-signals';

type Unsubscribe = () => void;
type Subscribe = (callback: () => void) => Unsubscribe;
type GetValue = () => unknown;
type SetValue = (path: unknown[], value: unknown) => void;

const createSignal = <T extends object>(
  proxyObject: T,
): [Subscribe, GetValue, SetValue] => {
  const sub: Subscribe = (callback) => subscribe(proxyObject, callback);
  const get: GetValue = () => snapshot(proxyObject);
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

const { getSignal, inject } = createReactSignals(
  createSignal,
  true,
  'value',
  VALUE_PROP,
);

export const createElement = inject(ReactExports.createElement);

type AttachValue<T> = T & { value: T } & {
  readonly [K in keyof T]: AttachValue<T[K]>;
};

export function $<T extends object>(proxyObject: T): AttachValue<Snapshot<T>>;

export function $<T extends object>(proxyObject: T) {
  return getSignal(proxyObject);
}
