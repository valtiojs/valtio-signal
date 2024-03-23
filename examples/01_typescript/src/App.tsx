/** @jsxImportSource valtio-signal */

import { proxy } from 'valtio/vanilla';
import { useSnapshot } from 'valtio/react';
import { $ } from 'valtio-signal';

const state = proxy({ count: 0, text: 'hello' });

const CounterWithSignal = () => {
  return (
    <div>
      <h1>With $(proxy)</h1>
      Count: {$(state).count} ({Math.random()})
    </div>
  );
};

const Counter = () => {
  const { count } = useSnapshot(state);
  return (
    <div>
      <h1>With useSnapshot(proxy)</h1>
      Count: {count} ({Math.random()})
    </div>
  );
};

const Controls = () => {
  return (
    <div>
      <button type="button" onClick={() => ++state.count}>
        Increment
      </button>
      <button
        type="button"
        onClick={() => {
          state.text += '!';
        }}
      >
        Change text
      </button>
    </div>
  );
};

const App = () => (
  <>
    <Controls />
    <CounterWithSignal />
    <Counter />
  </>
);

export default App;
