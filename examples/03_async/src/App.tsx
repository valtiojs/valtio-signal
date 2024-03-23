/// <reference types="react/experimental" />
/** @jsxImportSource valtio-signal */

import { Suspense } from 'react';
import { proxy } from 'valtio/vanilla';
import { useSnapshot } from 'valtio';
import { $ } from 'valtio-signal';

const fetchUser = async (id: number) => {
  const response = await fetch(`https://reqres.in/api/users/${id}`);
  const { data } = await response.json();
  return `ID: ${data.id}, Name: ${data.first_name} ${data.last_name}`;
};

const state = proxy({
  id: 1,
  user: fetchUser(1),
});

const setUserId = (id: number) => {
  state.id = id;
  state.user = fetchUser(id);
};

const createRandomColor = () => `#${Math.random().toString(16).slice(-6)}`;

const UserWithSignal = () => {
  return (
    <div style={{ backgroundColor: createRandomColor() }}>
      User: {$(state).user}
    </div>
  );
};

const User = () => {
  const { user } = useSnapshot(state);
  return (
    <div style={{ backgroundColor: createRandomColor() }}>User: {user}</div>
  );
};

const Controls = () => {
  const { id } = useSnapshot(state);
  return (
    <div>
      ID: {id}{' '}
      <button type="button" onClick={() => setUserId(id - 1)}>
        Prev
      </button>{' '}
      <button type="button" onClick={() => setUserId(id + 1)}>
        Next
      </button>
    </div>
  );
};

const App = () => (
  <>
    <Controls />
    <h1>With $(proxy)</h1>
    <Suspense fallback="Loading...">
      <UserWithSignal />
    </Suspense>
    <h1>With useSnapshot(proxy)</h1>
    <Suspense fallback="Loading...">
      <User />
    </Suspense>
  </>
);

export default App;
