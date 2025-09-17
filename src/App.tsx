/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { USER_ID } from './api/todos';
import * as postService from './api/todos';
import { Todo } from './types/Todo';
import classNames from 'classnames';
import { Header } from './components/Header/Header';
import { TodoList } from './components/TodoList/TodoList';
import { Footer } from './components/Footer/Footer';
import { SelectFilterValue } from './types/SelectFilterValue';
import { TempTodo } from './components/TempTodo/TempTodo';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoTitle, setTodoTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectValue, setSelectValue] = useState<SelectFilterValue>(
    SelectFilterValue.All,
  );
  const [count, setCount] = useState(0);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [processingIds, setProcessingIds] = useState<number[]>([]);

  const titleField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titleField.current) {
      titleField.current.focus();
    }
  }, [loading, todos.length]);

  function getTodos() {
    setErrorMessage(null);

    return postService
      .getTodos()
      .then(setTodos)
      .catch(error => {
        setErrorMessage('Unable to load todos');
        throw error;
      });
  }

  function addTodo({ userId, title, completed }: Omit<Todo, 'id'>) {
    setErrorMessage(null);
    setLoading(true);

    return postService
      .addTodo({ userId, title, completed })
      .then(newTodo => {
        setTodoTitle('');
        setTodos(currentTodos => [...currentTodos, newTodo]);
      })
      .catch(error => {
        setErrorMessage('Unable to add a todo');
        throw error;
      })
      .finally(() => {
        setLoading(false);
        setTempTodo(null);
      });
  }

  function deleteTodo(todoId: number) {
    setProcessingIds(ids => [...ids, todoId]);

    return postService
      .deleteTodo(todoId)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        );
      })
      .catch(() => {
        setTodos(todos);
        setErrorMessage('Unable to delete a todo');
      })
      .finally(() => {
        setProcessingIds(ids => ids.filter(id => id !== todoId));
        setLoading(false);
      });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorMessage(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [errorMessage]);

  useEffect(() => {
    getTodos();
  }, []);

  useEffect(() => {
    setCount(todos.filter(todo => todo.completed === false).length);
  }, [todos]);

  const filteredTodos: Todo[] = useMemo(() => {
    return todos.filter(todo => {
      if (selectValue === 'active') {
        return !todo.completed;
      }

      if (selectValue === 'completed') {
        return todo.completed;
      }

      return true;
    });
  }, [todos, selectValue]);

  function toggleTodo(id: number) {
    setTodos(currentTodos =>
      currentTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  function clearCompletedTodo() {
    todos.forEach(todo => todo.completed && deleteTodo(todo.id));
  }

  if (!USER_ID) {
    return <UserWarning />;
  }

  function handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    setTodoTitle(event.target.value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (todoTitle.trim().length === 0) {
      setErrorMessage('Title should not be empty');

      return;
    }

    setTempTodo({
      id: 0,
      userId: USER_ID,
      title: todoTitle.trim(),
      completed: false,
    });

    addTodo({
      userId: USER_ID,
      title: todoTitle.trim(),
      completed: false,
    });

    return;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          todos={todos}
          handleSubmit={handleSubmit}
          titleField={titleField}
          todoTitle={todoTitle}
          handleInput={handleInput}
          loading={loading}
        />
        <TodoList
          filteredTodos={filteredTodos}
          onToggle={toggleTodo}
          processingIds={processingIds}
          deleteTodo={deleteTodo}
        />

        {loading && <TempTodo tempTodo={tempTodo} loading={loading} />}

        {todos.length !== 0 && (
          <Footer
            todos={todos}
            count={count}
            selectValue={selectValue}
            setSelectValue={setSelectValue}
            deleteComlpetedTodos={clearCompletedTodo}
          />
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !errorMessage },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => {
            setErrorMessage(null);
          }}
        />
        {errorMessage}
      </div>
    </div>
  );
};
