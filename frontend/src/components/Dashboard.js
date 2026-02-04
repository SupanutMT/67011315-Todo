import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.APIURL || "http://localhost:5001/api";
const DEFAULT_AVATAR = "/default-avatar.png";

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const userId = user?.id;
  const fullName = user?.full_name || user?.fullName || user?.username;
  const profileImage =
    user?.profile_image || user?.profileImage || DEFAULT_AVATAR;

  const [ownedTeams, setOwnedTeams] = useState([]);
  const [memberTeams, setMemberTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (userId) fetchTeams();
  }, [userId]);

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_URL}/teams?user_id=${userId}`);
      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      const owned = data.filter((t) => t.admin_user_id === userId);
      const member = data.filter((t) => t.admin_user_id !== userId);

      setOwnedTeams(owned);
      setMemberTeams(member);
    } catch (err) {
      console.error("Failed to load teams", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      setCreating(true);

      const res = await fetch(`${API_URL}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTeamName,
          admin_user_id: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert(data.message || "Failed to create team");
        return;
      }

      setNewTeamName("");
      setShowCreateTeam(false);
      fetchTeams(); // refresh dashboard
    } catch (err) {
      console.error("Create team error", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    const confirmed = window.confirm(
      "Are you sure? This will permanently delete the team and all its tasks.",
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/teams/${teamId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_user_id: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete team");
        return;
      }

      fetchTeams(); // refresh dashboard
    } catch (err) {
      console.error("Delete team error", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("todo_user");
    onLogout();
  };

  if (loading) {
    return (
      <div className="text-white text-center w-full">Loading dashboard...</div>
    );
  }

  return (
    <div className="w-full max-w-xl lg:max-w-6xl bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-xl p-5 sm:p-8">
      {/* ---------- Profile Header ---------- */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <img
          src={profileImage}
          alt="Profile"
          referrerPolicy="no-referrer"
          className="w-20 h-20 rounded-full border-2 border-blue-500 object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_AVATAR;
          }}
        />

        <h2 className="text-xl sm:text-2xl font-bold">
          👋 Welcome, <span className="text-blue-400">{fullName}</span>
        </h2>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Logout
        </button>
      </div>

      {/* ---------- Owned Teams ---------- */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-emerald-400">
            🛡️ Teams You Own
          </h3>

          <button
            onClick={() => setShowCreateTeam((v) => !v)}
            className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-sm font-semibold"
          >
            + New Team
          </button>

          {showCreateTeam && (
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name..."
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button
                onClick={handleCreateTeam}
                disabled={creating}
                className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          )}
        </div>

        {ownedTeams.length === 0 ? (
          <p className="text-white/60 text-sm">
            You haven’t created any teams yet.
          </p>
        ) : (
          <div className="grid gap-3">
            {ownedTeams.map((team) => (
              <div
                key={team.id}
                className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-900/20 hover:bg-emerald-900/40 transition"
              >
                {/* Clickable team info */}
                <div
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="cursor-pointer"
                >
                  <div className="font-semibold">{team.name}</div>
                  <div className="text-xs text-emerald-300 mt-1">
                    Role: Team Admin
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  className="mt-3 text-sm text-red-400 hover:text-red-500"
                >
                  🗑 Delete Team
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Member Teams ---------- */}
      <section>
        <h3 className="text-lg font-semibold mb-3 text-blue-400">
          👥 Teams You Joined
        </h3>

        {memberTeams.length === 0 ? (
          <p className="text-white/60 text-sm">
            You are not a member of any teams.
          </p>
        ) : (
          <div className="grid gap-3">
            {memberTeams.map((team) => (
              <div
                key={team.id}
                onClick={() => navigate(`/teams/${team.id}`)}
                className="cursor-pointer p-4 rounded-xl border border-blue-500/40 bg-blue-900/20 hover:bg-blue-900/40 transition"
              >
                <div className="font-semibold">{team.name}</div>
                <div className="text-xs text-blue-300 mt-1">
                  Role: Team Member
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
