// frontend/src/components/Login.js
import React, { useState } from 'react';

const API_URL = process.env.APIURL || "http://localhost:5001/api";

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Please enter a username.');
            return;
        }

        try {
            // Use Fetch API for POST request
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }), // Convert object to JSON string
            });

            // Check if the response status is OK (200-299)
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Login failed due to server error.');
                return;
            }

            const data = await response.json(); // Parse the response body as JSON

            if (data.success) {
                localStorage.setItem('todo_username', username);
                onLogin(username); // Update App component state
            } else {
                setError(data.message || 'Login failed.');
            }
        } catch (err) {
            // Handle network connection errors
            setError('Network error: Could not connect to the server.');
            console.error(err);
        }
    };

    return (
    <div className="w-full max-w-xl bg-slate-900 text-white rounded-2xl shadow-xl p-5 sm:p-8">
        
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">
        🔐 Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
        <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-xl font-semibold transition"
        >
            Login
        </button>
        </form>

        {error && (
        <p className="mt-4 text-center text-red-400 text-sm">
            {error}
        </p>
        )}
    </div>
    );
}

export default Login;