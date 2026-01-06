// frontend/src/components/TodoList.js
import React, { useState, useEffect } from 'react';

const API_URL = process.env.APIURL || "http://localhost:5001/api";

function TodoList({ username, onLogout }) {
    const [todos, setTodos] = useState([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        fetchTodos();
    }, [username]); // Refetch when username changes (e.g., after login)

    // 1. READ: Fetch all todos for the current user
    const fetchTodos = async () => {
        try {
            const response = await fetch(`${API_URL}/todos/${username}`);
            
            if (!response.ok) {
                console.error('Failed to fetch todos:', response.statusText);
                return;
            }

            const data = await response.json();
            setTodos(data);
        } catch (err) {
            console.error('Error fetching todos:', err);
        }
    };

    // 2. CREATE: Add a new todo
    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
            const response = await fetch(`${API_URL}/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, task: newTask }),
            });

            if (!response.ok) {
                console.error('Failed to add todo:', response.statusText);
                return;
            }

            const newTodo = await response.json();
            // Add the new item to the beginning of the list
            setTodos([newTodo, ...todos]); 
            setNewTask('');
        } catch (err) {
            console.error('Error adding todo:', err);
        }
    };

    // 3. UPDATE: Toggle the 'done' status
    const handleToggleDone = async (id, currentDoneStatus) => {
        const newDoneStatus = !currentDoneStatus;
        try {
            const response = await fetch(`${API_URL}/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ done: newDoneStatus }),
            });

            if (!response.ok) {
                console.error('Failed to update todo:', response.statusText);
                return;
            }

            // Update the status in the local state immediately
            setTodos(todos.map(todo => 
                todo.id === id ? { ...todo, done: newDoneStatus } : todo
            ));
        } catch (err) {
            console.error('Error toggling done status:', err);
        }
    };

    // 4. DELETE: Remove a todo item
    const handleDeleteTodo = async (id) => {
        try {
            const response = await fetch(`${API_URL}/todos/${id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                 console.error('Failed to delete todo:', response.statusText);
                return;
            }

            // Filter out the deleted item from the state
            setTodos(todos.filter(todo => todo.id !== id));
        } catch (err) {
            console.error('Error deleting todo:', err);
        }
    };

    const handleLogout = () => {
        // Clear storage and trigger state change in App.js
        localStorage.removeItem('todo_username');
        onLogout();
    };

    return (
    <div className="w-full max-w-xl bg-slate-900 text-white rounded-2xl shadow-xl p-5 sm:p-8">
      <div className="w-full max-w-xl bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-xl p-5 sm:p-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center">
            📝 Todo List for <span className="text-blue-400">{username}</span>
          </h2>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Add Task */}
        <form
          onSubmit={handleAddTodo}
          className="flex flex-col sm:flex-row gap-3 mb-5"
        >
          <input
            type="text"
            placeholder="New task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="flex-1 rounded-xl px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl font-semibold transition"
          >
            Add Task
          </button>
        </form>

        {/* Todo List Container (this is the key part) */}
        <div className="max-h-[50vh] overflow-y-auto pr-1">
          <ul className="space-y-3">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-start gap-3 bg-slate-800 px-4 py-3 rounded-xl"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={!!todo.done}
                  onChange={() => handleToggleDone(todo.id, todo.done)}
                  className="mt-1 accent-blue-500"
                />

                {/* Task Content */}
                <div className="flex-1">
                  <p
                    className={`break-words ${
                      todo.done
                        ? "line-through text-slate-400"
                        : "text-white"
                    }`}
                  >
                    {todo.task}
                  </p>

                  <small className="text-slate-400 text-xs">
                    Updated: {new Date(todo.updated).toLocaleString()}
                  </small>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-red-400 hover:text-red-500 text-sm font-semibold"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          {todos.length === 0 && (
            <p className="text-center text-slate-400 mt-6 text-sm">
              No tasks yet. Add one above 👆
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TodoList;