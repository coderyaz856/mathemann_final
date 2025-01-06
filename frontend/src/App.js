import React from "react";
import { Routes, Route, NavLink } from "react-router-dom"; // Use NavLink for styling
import Login from "./pages/Login"; // Ensure this points to the correct file
import Signup from "./pages/Signup";
import Learning from "./pages/Learning";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import "./styles/App.css";

function App() {
    return (
        <div className="app">
            <header className="header">
                <div className="logo">
                    <NavLink to="/" className="nav-link">Mathemann</NavLink> {/* Redirects to Home */}
                </div>
                <nav className="nav">
                    <NavLink
                        to="/login"
                        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                    >
                        Login
                    </NavLink>
                    <NavLink
                        to="/signup"
                        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                    >
                        Sign Up
                    </NavLink>
                    <NavLink
                        to="/learning"
                        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                    >
                        Learning
                    </NavLink>
                </nav>
            </header>
            <main className="main">
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/dashboard/student" element={<StudentDashboard />} />
                <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
            </Routes>
            </main>
        </div>
    );
}

export default App;
