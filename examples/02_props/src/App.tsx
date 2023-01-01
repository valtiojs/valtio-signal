/** @jsxImportSource valtio-signal */

import { proxy } from 'valtio/vanilla';
import { useSnapshot } from 'valtio';
import { $ } from 'valtio-signal';

const state = proxy({ count: 0 });

const CounterWithSignal = () => {
  return (
    <div>
      <h1>With $(proxy)</h1>
      <div style={{ position: 'relative', left: $(state).count }}>
        Random: {Math.random()}
      </div>
    </div>
  );
};

const Counter = () => {
  const { count } = useSnapshot(state);
  return (
    <div>
      <h1>With useSnapshot(proxy)</h1>
      <div style={{ position: 'relative', left: count }}>
        Random: {Math.random()}
      </div>
    </div>
  );
};

const Controls = () => {
  return (
    <div>
      <button type="button" onClick={() => ++state.count}>
        Increment
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
