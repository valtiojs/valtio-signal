# valtio-signal

Another React binding for Valtio proxy state

## What it is

To use Valtio proxy state, the official method is `useSnapshot`.
One could create a custom hook with `subscribe`, `snapshot` and `useState`.

This library provides the third method.
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
import { useEffect, useMemo, useState } from 'react';
import { snapshot, subscribe } from 'valtio';

const Counter = () => {
  const [value, setValue] = useState(() => snapshot(state).count);
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setValue(snapshot(state).count);
    });
    return unsubscribe;
  }, []);
  return (
    <div>
      {useMemo(() => 'Count: '), []}{value}{useMemo(() => ` (${Math.random()}) `, [])}
    </div>
  );
};
```
