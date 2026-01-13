// frontend/src/components/TodoList.js
import React, { useState, useEffect } from 'react';

const API_URL = process.env.APIURL || "http://localhost:5001/api";

const getStatusStyles = (status) => {
  switch (status) {
    case 0:
      return {
        container: "bg-slate-900/80 border-slate-700",
        select: "bg-slate-700 text-white",
        text: "text-white",
      };
    case 1:
      return {
        container: "bg-blue-900/40 border-blue-600/40",
        select: "bg-blue-600 text-white",
        text: "text-white",
      };
    case 2:
      return {
        container: "bg-emerald-900/40 border-emerald-600/40",
        select: "bg-emerald-700 text-white",
        text: "line-through text-white/70",
      };
    default:
      return {};
  }
};

const isOverdue = (todo) => {
  if (!todo.target_at) return false;
  if (todo.status === 2) return false; // Done
  return new Date(todo.target_at) < new Date();
};

const getCountdown = (target_at) => {
  const diff = new Date(target_at) - new Date();

  if (diff <= 0) return 'Overdue';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  return `${minutes}m left`;
};

/* ---------------- Task Column ---------------- */

const TaskColumn = ({
  title,
  tasks,
  handleStatusChange,
  handleDeleteTodo,
  handleUpdateTarget,
  editingId,
  editingTarget,
  setEditingId,
  setEditingTarget,
}) => (
  <div className="space-y-4">
    <h3 className="text-white/80 font-semibold text-lg">{title}</h3>

    <ul className="space-y-3">
      {tasks.map(todo => {
        const styles = getStatusStyles(todo.status);

        return (
          <li
            key={todo.id}
            className={`flex gap-3 px-4 py-4 rounded-xl border
                        ${isOverdue(todo) ? 'border-red-500 bg-red-500/20' : styles.container}
                      `}
          >
            {/* Status */}
            <select
              value={todo.status}
              onChange={(e) => handleStatusChange(todo.id, e.target.value)}
              className={`rounded-lg px-3 py-1 text-sm font-semibold ${styles.select}`}
            >
              <option value={0}>Todo</option>
              <option value={1}>Doing</option>
              <option value={2}>Done</option>
            </select>

            {/* Content */}
            <div className="flex-1">
              <p className={styles.text}>{todo.task}</p>

              {/* Target datetime (editable + overdue + countdown) */}
                {editingId === todo.id ? (
                  <input
                    type="datetime-local"
                    value={editingTarget}
                    onChange={(e) => setEditingTarget(e.target.value)}
                    onBlur={() => {
                      handleUpdateTarget(todo.id, editingTarget);
                      setEditingId(null);
                    }}
                    className="mt-1 bg-slate-800 text-white text-xs rounded px-2 py-1"
                    autoFocus
                  />
                ) : (
                  <small
                    className={`block text-xs mt-1 cursor-pointer hover:underline ${
                      isOverdue(todo) ? 'text-red-400 font-semibold' : 'text-white/70'
                    }`}
                    onClick={() => {
                      setEditingId(todo.id);
                      setEditingTarget(
                        todo.target_at
                          ? new Date(todo.target_at).toISOString().slice(0, 16)
                          : ''
                      );
                    }}
                  >
                    🎯 Target: {todo.target_at
                      ? new Date(todo.target_at).toLocaleString()
                      : 'Click to set'}
                    {todo.target_at && (
                      <>
                        {' • '}⏳ {getCountdown(todo.target_at)}
                      </>
                    )}
                  </small>
                )}

              <small className="block text-white/60 text-xs mt-1">
                Updated: {new Date(todo.updated).toLocaleString()}
              </small>
            </div>

            {/* Delete */}
            <button
              onClick={() => handleDeleteTodo(todo.id)}
              className="text-red-400 hover:text-red-500"
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  </div>
);

/* ---------------- Main Component ---------------- */

function TodoList({ username, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [targetAt, setTargetAt] = useState('');

  // ✅ editing states (FIXED LOCATION)
  const [editingId, setEditingId] = useState(null);
  const [editingTarget, setEditingTarget] = useState('');

  useEffect(() => {
    fetchTodos();
  }, [username]);

  const sortByUrgency = (a, b) => {
    const now = Date.now();

    const timeA = a.target_at
      ? new Date(a.target_at).getTime() - now
      : Infinity;

    const timeB = b.target_at
      ? new Date(b.target_at).getTime() - now
      : Infinity;

    return timeA - timeB;
  };

  const todosByStatus = {
    0: todos.filter(t => t.status === 0).sort(sortByUrgency),
    1: todos.filter(t => t.status === 1).sort(sortByUrgency),
    2: todos.filter(t => t.status === 2).sort(sortByUrgency),
  };

  const fetchTodos = async () => {
    const res = await fetch(`${API_URL}/todos/${username}`);
    const data = await res.json();
    setTodos(data);
  };

  const handleAddTodo = async (e) => {
  e.preventDefault();
  if (!newTask.trim()) return;

  try {
    const response = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        task: newTask,
        target_at: targetAt
          ? targetAt.replace('T', ' ') + ':00'
          : null,
      }),
    });

    if (!response.ok) {
      console.error('Failed to add todo');
      return;
    }

    const newTodo = await response.json();
    setTodos([newTodo, ...todos]);
    setNewTask('');
    setTargetAt('');
  } catch (err) {
    console.error('Error adding todo:', err);
  }
};

  const handleStatusChange = async (id, status) => {
    await fetch(`${API_URL}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: Number(status) }),
    });

    setTodos(todos.map(t =>
      t.id === id ? { ...t, status: Number(status) } : t
    ));
  };

  const handleUpdateTarget = async (id, target_at) => {
    const formattedTarget = target_at
      ? target_at.replace('T', ' ') + ':00'
      : null;

    await fetch(`${API_URL}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_at: formattedTarget,
      }),
    });

    setTodos(todos.map(t =>
      t.id === id ? { ...t, target_at: formattedTarget } : t
    ));
  };

  const handleDeleteTodo = async (id) => {
    await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE' });
    setTodos(todos.filter(t => t.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem('todo_username');
    onLogout();
  };

  return (
    <div className="w-full max-w-xl lg:max-w-7xl bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-xl p-5 sm:p-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">
          📝 Todo List for <span className="text-blue-400">{username}</span>
        </h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Logout
        </button>
      </div>

      {/* Add Task */}
      <form onSubmit={handleAddTodo} className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="New task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2 text-black"
        />
        <input
          type="datetime-local"
          value={targetAt}
          onChange={(e) => setTargetAt(e.target.value)}
          className="rounded-xl px-4 py-2 text-black"
        />
        <button className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl font-semibold">
          Add Task
        </button>
      </form>

      {/* Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[50vh] overflow-y-auto pr-1">
        {[0, 1, 2].map(status => (
          <TaskColumn
            key={status}
            title={['Todo', 'Doing', 'Done'][status]}
            tasks={todosByStatus[status]}
            handleStatusChange={handleStatusChange}
            handleDeleteTodo={handleDeleteTodo}
            handleUpdateTarget={handleUpdateTarget}
            editingId={editingId}
            editingTarget={editingTarget}
            setEditingId={setEditingId}
            setEditingTarget={setEditingTarget}
          />
        ))}
      </div>
    </div>
  );
}

export default TodoList;
