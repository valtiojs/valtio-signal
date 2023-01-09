/** @jsxImportSource valtio-signal */

import { proxy } from 'valtio/vanilla';
import { $ } from 'valtio-signal';

const state = proxy({ count: 0 });

const inc = () => {
  const prevCount = ($(state).count as any)();
  const nextCount = prevCount + 1;
  ($(state).count as any)(nextCount);
};

const CounterWithSignal = () => {
  return (
    <div>
      <h1>With $(proxy)</h1>
      Count: {$(state).count} ({Math.random()})
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
