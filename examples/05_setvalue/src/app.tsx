/** @jsxImportSource valtio-signal */

import { proxy } from 'valtio/vanilla';
import { $ } from 'valtio-signal';

const state = proxy({ count: 0 });

const inc = () => {
  const prevCount = $(state).count.value;
  const nextCount = prevCount + 1;
  $(state).count.value = nextCount;
};

const CounterWithSignal = () => {
  return (
    <div>
      <h1>With $(proxy)</h1>
      <div>
        Count: {$(state).count}, {$(state).count} ({Math.random()})
      </div>
    </div>
  );
};

const Controls = () => {
  return (
    <div>
      <button type="button" onClick={inc}>
        Increment
      </button>
    </div>
  );
};

const App = () => (
  <>
    <Controls />
    <CounterWithSignal />
  </>
);

export default App;
