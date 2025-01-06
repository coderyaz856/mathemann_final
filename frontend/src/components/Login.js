import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            console.log("Attempting login...");
            const loginResponse = await axios.post('http://localhost:5000/api/users/login', { email, password });
            console.log("Login response:", loginResponse.data);

            const role = loginResponse.data.role; // Extract role from login response
            console.log("User role:", role);

            if (role === 'student') {
                console.log("Fetching student dashboard...");
                const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/student', {
                    data: { email, password }, // Include email and password in the body
                });
                console.log("Student dashboard response:", dashboardResponse.data);

                // Save dashboard data to localStorage or pass it to the next component
                localStorage.setItem('studentDashboard', JSON.stringify(dashboardResponse.data));
                navigate('/dashboard/student');
            } else if (role === 'teacher') {
                console.log("Fetching teacher dashboard...");
                const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/teacher', {
                    data: { email, password }, // Include email and password in the body
                });
                console.log("Teacher dashboard response:", dashboardResponse.data);

                // Save dashboard data to localStorage or pass it to the next component
                localStorage.setItem('teacherDashboard', JSON.stringify(dashboardResponse.data));
                navigate('/dashboard/teacher');
            } else {
                console.error("Unknown role detected:", role);
                alert('Unknown role. Please contact support.');
            }
        } catch (err) {
            console.error("Login error:", err.response ? err.response.data : err.message);
            setError('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="auth-container">
            <h1>Login</h1>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    required
                />
                <button type="submit" className="auth-button">Login</button>
            </form>
            {error && <div className="auth-feedback auth-error">{error}</div>}
        </div>
    );
};

export default Login;
