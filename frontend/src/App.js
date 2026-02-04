// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from './components/Login';
import Register from './components/Register';
import TodoList from './components/TodoList';
import OAuthSuccess from "./components/OAuthSuccess";
import cei_logo from "./assets/cei_logo.png";
import Dashboard from "./components/Dashboard";


function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore user from localStorage on refresh
    useEffect(() => {
        const storedUser = localStorage.getItem('todo_user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const handleLogin = (user) => {
        setCurrentUser(user);
        localStorage.setItem('todo_user', JSON.stringify(user));
    };

    const handleLogout = () => {
        localStorage.removeItem('todo_user');
        setCurrentUser(null);
    };

    // 🔒 Prevent redirect before auth state is restored
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">

                {/* Header */}
                <header className="border-b border-slate-700/50">
                    <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center font-bold">
                            <img
                                src={cei_logo}
                                alt="App logo"
                                className="w-20 h-20 rounded-xl object-contain"
                            />
                        </div>

                        <h1 className="text-lg sm:text-xl font-semibold">
                            Full Stack Todo App
                        </h1>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex justify-center px-4 py-8">
                    <Routes>

                        {/* 🔐 Login */}
                        <Route
                            path="/login"
                            element={
                                currentUser
                                    ? <Navigate to="/dashboard" />
                                    : <Login onLogin={handleLogin} />
                            }
                        />

                        {/* 📝 Register */}
                        <Route
                            path="/register"
                            element={
                                currentUser
                                    ? <Navigate to="/dashboard" />
                                    : <Register onLogin={handleLogin} />
                            }
                        />

                        {/* 🔑 Google OAuth redirect */}
                        <Route
                            path="/oauth-success"
                            element={<OAuthSuccess onLogin={handleLogin} />}
                        />

                        {/* 📊 Dashboard */}
                        <Route
                            path="/dashboard"
                            element={
                                currentUser
                                ? <Dashboard user={currentUser} onLogout={handleLogout} />
                                : <Navigate to="/login" />
                            }
                            />

                        {/* 📋 Team Todo Page (placeholder for now) */}
                        <Route
                            path="/teams/:teamId"
                            element={
                                currentUser
                                    ? <TodoList user={currentUser} onLogout={handleLogout} />
                                    : <Navigate to="/login" />
                            }
                        />

                        {/* 🌐 Root redirect */}
                        <Route
                            path="/"
                            element={
                                currentUser
                                    ? <Navigate to="/dashboard" />
                                    : <Navigate to="/login" />
                            }
                        />

                    </Routes>

                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
