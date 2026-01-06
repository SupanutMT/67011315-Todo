// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import TodoList from './components/TodoList';
import cei_logo from "./assets/cei_logo.png";

function App() {
    const [currentUser, setCurrentUser] = useState(null);

    // Check for stored username on initial load
    useEffect(() => {
        const storedUser = localStorage.getItem('todo_username');
        if (storedUser) {
            setCurrentUser(storedUser);
        }
    }, []);

    const handleLogin = (username) => {
        setCurrentUser(username);
    };

    const handleLogout = () => {
        // Clear username from local storage and state
        localStorage.removeItem('todo_username');
        setCurrentUser(null);
    };

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        
        {/* Header */}
        <header className="border-b border-slate-700/50">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
            
            {/* Logo placeholder */}
            <div className="w-20 h-20 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
            <img
                src={cei_logo}
                alt="App logo"
                className="w-20 h-20 rounded-xl object-contain"/>
            </div>

            <h1 className="text-lg sm:text-xl font-semibold">
            Full Stack Todo App
            </h1>
        </div>
        </header>

        {/* Main Content */}
        <main className="flex justify-center px-4 py-8">
        {currentUser ? (
            <TodoList username={currentUser} onLogout={handleLogout} />
        ) : (
            <Login onLogin={handleLogin} />
        )}
        </main>
    </div>
    );
}

export default App;