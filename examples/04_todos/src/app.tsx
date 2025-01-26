/** @jsxImportSource valtio-signal */

import { memo } from 'react';
import type { FormEvent } from 'react';
import { proxy } from 'valtio/vanilla';
import { useSnapshot } from 'valtio/react';
import { derive } from 'derive-valtio';
import { $ } from 'valtio-signal';

const createRandomColor = () => `hsl(${Math.random() * 360}deg,100%,50%)`;

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

const state = proxy({
  filter: 'all' as 'all' | 'completed' | 'incompleted',
  todos: [] as Todo[],
});

const derived = derive({
  filtered: (get) => {
    const { filter, todos } = get(state);
    if (filter === 'all') {
      return todos;
    }
    if (filter === 'completed') {
      return todos.filter((todo) => todo.completed);
    }
    return todos.filter((todo) => !todo.completed);
  },
});

type RemoveFn = (item: Todo) => void;
type TodoItemProps = {
  todo: Todo;
  remove: RemoveFn;
};

const TodoItem = memo(function TodoItem({ todo, remove }: TodoItemProps) {
  const toggleCompleted = () => {
    // eslint-disable-next-line react-compiler/react-compiler
    todo.completed = !todo.completed;
  };
  return (
    <div style={{ backgroundColor: createRandomColor() }}>
      <input
        type="checkbox"
        checked={$(todo).completed}
        onChange={toggleCompleted}
      />
      <span
        style={{
          textDecoration: $(
            derive({
              textDecoration: (get) =>
                get(todo).completed ? 'line-through' : '',
            }),
          ).textDecoration,
        }}
      >
        {$(todo).title}
      </span>
      <button type="button" onClick={() => remove(todo)}>
        Remove
      </button>
    </div>
  );
});

const Filter = () => {
  const { filter } = useSnapshot(state);
  return (
    <div>
      {(['all', 'completed', 'incompleted'] as const).map((f) => (
        <label htmlFor={f} key={f}>
          <input
            name={f}
            type="radio"
            value={f}
            checked={filter === f}
            onChange={() => {
              state.filter = f;
            }}
          />
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </label>
      ))}
    </div>
  );
};

type FilteredProps = {
  remove: RemoveFn;
};
const Filtered = ({ remove }: FilteredProps) => (
  <div style={{ padding: 30, backgroundColor: createRandomColor() }}>
    {$(derived).filtered.map((todo, index) => (
      <TodoItem
        key={todo.id}
        todo={derived.filtered[index] as Todo}
        remove={remove}
      />
    ))}
  </div>
);

let nextId = 1;

const TodoList = () => {
  const remove: RemoveFn = (todo) => {
    const index = state.todos.indexOf(todo);
    state.todos.splice(index, 1);
  };
  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = e.currentTarget.inputTitle.value;
    e.currentTarget.inputTitle.value = '';
    state.todos.push({ title, completed: false, id: nextId++ });
  };
  return (
    <form onSubmit={add}>
      <Filter />
      <div style={{ margin: 5 }}>
        <input name="inputTitle" placeholder="Enter title..." />
      </div>
      <Filtered remove={remove} />
    </form>
  );
};

const App = () => (
  <>
    <h1>Valtio-Signal TODOs App</h1>
    <TodoList />
  </>
);

export default App;
