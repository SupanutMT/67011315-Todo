import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.APIURL || "http://localhost:5001/api";

function Register({ onLogin }) {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          username,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Register failed");
        return;
      }

      localStorage.setItem("todo_user", JSON.stringify(data.user));
      onLogin(data.user);

      navigate("/");

    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="w-full max-w-xl bg-slate-900 text-white rounded-2xl shadow-xl p-5 sm:p-8">
      <h2 className="text-xl font-bold mb-6 text-center">📝 Register</h2>

      <form onSubmit={handleRegister} className="space-y-4">
        <input
          className="w-full rounded-xl px-4 py-2 text-black"
          placeholder="Full Name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
        />

        <input
          className="w-full rounded-xl px-4 py-2 text-black"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full rounded-xl px-4 py-2 text-black"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button className="w-full bg-emerald-600 py-2 rounded-xl font-semibold">
          Create Account
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <span
          className="text-blue-400 cursor-pointer hover:underline"
          onClick={() => navigate("/login")}
        >
          Login
        </span>
      </p>

      {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
    </div>
  );
}

export default Register;
