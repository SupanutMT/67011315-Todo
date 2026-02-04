import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

const API_URL = process.env.APIURL || "http://localhost:5001/api";

function Login({ onLogin }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!captchaToken) {
      setError('Please verify you are not a robot.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, captchaToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
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
      <h2 className="text-xl font-bold mb-6 text-center">🔐 Login</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <ReCAPTCHA
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
          onChange={setCaptchaToken}
        />

        <button className="w-full bg-blue-600 py-2 rounded-xl font-semibold">
          Login
        </button>

        <button
          type="button"
          onClick={() => window.location.href = "http://localhost:5001/api/auth/google"}
          className="w-full bg-red-600 py-2 rounded-xl font-semibold"
        >
          🔐 Login with Google
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Don’t have an account?{" "}
        <span
          className="text-blue-400 cursor-pointer hover:underline"
          onClick={() => navigate("/register")}
        >
          Register
        </span>
      </p>

      {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
    </div>
  );
}

export default Login;
