import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";

const API_URL = process.env.APIURL || "http://localhost:5001/api";
const DEFAULT_AVATAR = "/default-avatar.png";

/* ---------------- Helpers ---------------- */

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
  if (todo.status === 2) return false;
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
  members,
  currentUser,
  canEditTodo,
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

        const assignedUser =
          members.find(m => m.user_id === todo.user_id);

        const assignedName =
          assignedUser
            ? assignedUser.full_name || assignedUser.username
            : 'Unknown';

        const isMe = todo.user_id === currentUser?.id;

        return (
          <li
            key={todo.id}
            className={`flex gap-3 px-4 py-4 rounded-xl border
              ${isOverdue(todo)
                ? 'border-red-500 bg-red-500/20'
                : styles.container}`}
          >
            <select
              value={todo.status}
              disabled={!canEditTodo(todo)}
              onChange={(e) => handleStatusChange(todo.id, e.target.value)}
              className={`rounded-lg px-3 py-1 text-sm font-semibold ${styles.select}`}
            >
              <option value={0}>Todo</option>
              <option value={1}>Doing</option>
              <option value={2}>Done</option>
            </select>

            <div className="flex-1">
              <p className={styles.text}>{todo.task}</p>

              <small className="block text-xs text-white/50 mt-1">
                👤 Assigned to{' '}
                <span className="font-medium text-white/70">
                  {isMe ? 'You' : assignedName}
                </span>
              </small>

              {editingId === todo.id ? (
                <input
                  type="datetime-local"
                  disabled={!canEditTodo(todo)}
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
                    isOverdue(todo)
                      ? 'text-red-400 font-semibold'
                      : 'text-white/70'
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
                  {todo.target_at && <> • ⏳ {getCountdown(todo.target_at)}</>}
                </small>
              )}
            </div>

            <button
              disabled={!canEditTodo(todo)}
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

/* ---------------- Main ---------------- */
  

function TodoList({ user }) {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [role, setRole] = useState('');
  const [todos, setTodos] = useState([]);
  const [members, setMembers] = useState([]);

  const [newTask, setNewTask] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editingTarget, setEditingTarget] = useState('');

  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const [removingId, setRemovingId] = useState(null);
  

  const isAdminUser = (memberId) =>
    team?.admin_user_id === memberId;

  const canEditTodo = (todo) => {
  if (!user) return false;
  return role === "admin" || todo.user_id === user.id;
};

  const todosByStatus = {
    0: todos.filter(t => t.status === 0),
    1: todos.filter(t => t.status === 1),
    2: todos.filter(t => t.status === 2),
  };

  const profileImage =
    user?.profile_image || user?.profileImage || DEFAULT_AVATAR;

  /* ---------------- Fetchers ---------------- */

  const fetchTeam = async () => {
    if (!user?.id || !teamId) return;

    const res = await fetch(`${API_URL}/teams?user_id=${user.id}`);
    const teams = await res.json();

    const currentTeam = teams.find(t => t.id === Number(teamId));
    if (!currentTeam) return;

    setTeam(currentTeam);

    const mRes = await fetch(`${API_URL}/teams/${teamId}/members`);
    setMembers(await mRes.json());

    setRole(
      currentTeam.admin_user_id === user.id ? "admin" : "member"
    );
  };

  // ✅ THIS WAS MISSING
  const fetchTodos = async () => {
    try {
      const res = await fetch(`${API_URL}/todos/user/${user.id}`);
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error("Failed to fetch todos", err);
    }
  };

  const fetchAllUsers = async () => {
  try {
    const res = await fetch(`${API_URL}/users`);
    const data = await res.json();
    console.log("ALL USERS:", data);
    setAllUsers(data);
  } catch (err) {
    console.error("Failed to fetch users", err);
  }
};


  useEffect(() => {
    fetchTeam();
    fetchTodos();
  }, [teamId]);

  /* ---------------- Actions ---------------- */

  const handleAddTodo = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: newTask,
        team_id: Number(teamId),
        user_id: Number(assignedUserId), // owner
        created_by: user.id,
      }),
    });

    const newTodo = await res.json();
    setTodos([newTodo, ...todos]);
    setNewTask('');
    setAssignedUserId('');
  };

  const handleStatusChange = async (id, status) => {
    const todo = todos.find(t => t.id === id);
    if (!todo || !canEditTodo(todo, user, role)) return;

    await fetch(`${API_URL}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: Number(status),
        user_id: user.id   // REQUIRED for backend permission check
      }),
    });

    setTodos(todos.map(t =>
      t.id === id ? { ...t, status: Number(status) } : t
    ));
  };


  const handleUpdateTarget = async (id, target_at) => {
    const todo = todos.find(t => t.id === id);
    if (!todo || !canEditTodo(todo, user, role)) return;

    const formatted = target_at
      ? target_at.replace('T', ' ') + ':00'
      : null;

    await fetch(`${API_URL}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_at: formatted,
        user_id: user.id
      }),
    });

    setTodos(todos.map(t =>
      t.id === id ? { ...t, target_at: formatted } : t
    ));
  };


  const handleDeleteTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo || !canEditTodo(todo, user, role)) return;

    await fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id })
    });

    setTodos(todos.filter(t => t.id !== id));
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    const res = await fetch(`${API_URL}/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: Number(selectedUserId), // user being added
        admin_user_id: user.id           // admin performing the action
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error(err);
      return;
    }

    // refresh members
    await fetchTeam();

    // reset UI
    setShowAddMember(false);
    setSelectedUserId('');
  };

  const handleRemoveMember = async (memberId) => {
    if (!team || role !== "admin") return;

    try {
      await fetch(
        `${API_URL}/teams/${teamId}/members/${memberId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            admin_user_id: user.id,
          }),
        }
      );

      // refresh team members
      await fetchTeam();
    } catch (err) {
      console.error("Failed to remove member", err);
    }
  };



  return (
    <div className="w-full max-w-7xl bg-slate-900 rounded-2xl border border-slate-700 p-6">

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <img
            src={profileImage}
            onError={(e) => e.currentTarget.src = DEFAULT_AVATAR}
            className="w-12 h-12 rounded-full object-cover border"
          />
          <div>
            <p className="font-semibold">{user.full_name || user.username}</p>
            <p className="text-sm text-white/60">
              Todo List for <b>{user.full_name || user.username}</b> in{" "}
              <b>{team?.name}</b> as <b>{role}</b>
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Team Members */}
      <div className="mb-6">
        <button
          onClick={() => setShowMembers(!showMembers)}
          className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm"
        >
          👥 Team Members
        </button>

        {showMembers && (
        <div className="mt-4 space-y-2">
          {members.map(m => (
            <div
              key={m.user_id}
              className="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {m.full_name || m.username}
                </span>

                {isAdminUser(m.user_id) && (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-600">
                    Admin
                  </span>
                )}
              </div>

              {/* ❌ Remove button (admin only, cannot remove self) */}
              {role === "admin" && m.user_id !== user.id && (
                <button
                  onClick={() => handleRemoveMember(m.user_id)}
                  disabled={removingId === m.user_id}
                  className="text-red-400 hover:text-red-500 text-sm disabled:opacity-40"
                  title="Remove from team"
                >
                  {removingId === m.user_id ? "…" : "✕"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Admin: Add Member */}
        {role === 'admin' && (
          <div className="mb-6">
            {!showAddMember ? (
              <button
                onClick={() => {
                  setShowAddMember(true);
                  fetchAllUsers();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold"
              >
                ➕ Add member
              </button>
            ) : (
              <div className="flex gap-3 items-center">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="rounded-xl px-3 py-2 text-black"
                >
                  <option value="">Select user…</option>
                  {allUsers
                    .filter(u =>
                      !members.some(m =>
                        (m.user_id ?? m.id) === u.id
                      )
                    )
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.username}
                      </option>
                    ))}
                </select>

                <button
                  onClick={handleAddMember}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold"
                >
                  Add to team
                </button>

                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedUserId('');
                  }}
                  className="text-sm text-white/60 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}


      {/* Add Task (Admin only) */}
      {role === 'admin' && (
        <form onSubmit={handleAddTodo} className="flex gap-3 mb-6">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New task..."
            className="flex-1 rounded-xl px-4 py-2 text-black"
            required
          />

          <select
            value={assignedUserId}
            onChange={(e) => setAssignedUserId(e.target.value)}
            className="rounded-xl px-3 py-2 text-black"
            required
          >
            <option value="">Assign to…</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name}
              </option>
            ))}
          </select>

          <button className="bg-blue-600 px-5 rounded-xl font-semibold">
            Add
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[0, 1, 2].map(status => (
          <TaskColumn
            key={status}
            title={['Todo', 'Doing', 'Done'][status]}
            tasks={todosByStatus[status]}
            members={members}
            currentUser={user}
            canEditTodo={canEditTodo}
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
