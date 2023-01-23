# valtio-signal

[![CI](https://img.shields.io/github/actions/workflow/status/dai-shi/valtio-signal/ci.yml?branch=main)](https://github.com/dai-shi/valtio-signal/actions?query=workflow%3ACI)
[![npm](https://img.shields.io/npm/v/valtio-signal)](https://www.npmjs.com/package/valtio-signal)
[![size](https://img.shields.io/bundlephobia/minzip/valtio-signal)](https://bundlephobia.com/result?p=valtio-signal)
[![discord](https://img.shields.io/discord/627656437971288081)](https://discord.gg/MrQdmzd)

Another React binding for Valtio proxy state

## What it is

To use Valtio proxy state, the official method is `useSnapshot`.
There's alternative library called [use-valtio](https://github.com/dai-shi/use-valtio).

This library provides yet another method.
It follows [jotai-signal](https://github.com/jotai-labs/jotai-signal),
which is a variant of [@preact/signals-react](https://www.npmjs.com/package/@preact/signals-react).

It allows to use the proxy state in React without using hooks.
We don't need to follow the rules of hooks.

## How to use it

```jsx
/** @jsxImportSource valtio-signal */

import { proxy } from 'valtio/vanilla';
import { $ } from 'valtio-signal';

const state = proxy({ count: 0 });

setInterval(() => {
  ++state.count;
}, 100);

const Counter = () => (
  <div>
    Count: {$(state).count}
  </div>
);
```

## How it works

The pragma at the first line does the trick.
It will transform the code with signal to the code that React can handle.

### Original code

```jsx
/** @jsxImportSource valtio-signal */

const Counter = () => (
  <div>
    Count: {$(state).count} ({Math.random()})
  </div>
);
```

### Pseudo transformed code

```jsx
import { useEffect, useMemo, useReducer } from 'react';
import { snapshot, subscribe } from 'valtio';

const Counter = () => {
  const [, rerender] = useReducer((c) => c + 1, 0);
  useEffect(() => {
    let lastValue;
    const unsubscribe = subscribe(() => {
      const nextValue = snapshot(state).count;
      if (lastValue !== nextValue) {
        lastValue = nextValue;
        rerender();
      }
    });
    return unsubscribe;
  }, []);
  return (
    <div>
      {useMemo(() => 'Count: '), []}
      {snapshot(state).count}
      {useMemo(() => ` (${Math.random()})`, [])}
    </div>
  );
};
```
