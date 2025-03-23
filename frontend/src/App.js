import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from './components/NavBar';
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Learning from "./pages/Learning";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import Profile from "./components/Profile/Profile";
import "./styles/App.css";
import MainLayout from "./components/Layout/MainLayout";
import Home from "./pages/Home";
import ChapterView from './components/ChapterView';
import EnhancedChapterView from './components/EnhancedChapterView';
import QuizView from './components/QuizView';

const App = () => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        userRole: null,
        userName: null,
        isLoading: true
    });

    useEffect(() => {
        console.log("App initializing, checking auth...");
        checkAuthStatus();
    }, []);
    
    const checkAuthStatus = () => {
        // Check if token exists
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');
        const userName = localStorage.getItem('userName');
        
        console.log("Auth check:", { token: !!token, userRole, userName });
        
        if (!token) {
            console.log("No token, not authenticated");
            setAuthState({
                isAuthenticated: false,
                userRole: null,
                userName: null,
                isLoading: false
            });
            return;
        }
        
        try {
            // Parse token to check expiration
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            
            const isExpired = payload.exp < (Date.now() / 1000);
            
            if (isExpired) {
                console.log("Token expired, clearing auth data");
                localStorage.clear();
                setAuthState({
                    isAuthenticated: false,
                    userRole: null,
                    userName: null,
                    isLoading: false
                });
            } else {
                console.log("Auth valid, setting state with:", userRole, userName);
                setAuthState({
                    isAuthenticated: true,
                    userRole: userRole,
                    userName: userName,
                    isLoading: false
                });
            }
        } catch (error) {
            console.error("Token validation error:", error);
            localStorage.clear();
            setAuthState({
                isAuthenticated: false,
                userRole: null,
                userName: null,
                isLoading: false
            });
        }
    };

    // Show loading state
    if (authState.isLoading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <BrowserRouter>
            <div className="app">
                <MainLayout 
                    isAuthenticated={authState.isAuthenticated}
                    userRole={authState.userRole}
                    userName={authState.userName}
                >
                    <Routes>
                        <Route path="/login" element={
                            authState.isAuthenticated ? 
                                <Navigate to={authState.userRole === 'student' ? '/dashboard/student' : '/dashboard/teacher'} /> :
                                <Login />
                        } />
                        <Route path="/signup" element={
                            authState.isAuthenticated ? 
                                <Navigate to={authState.userRole === 'student' ? '/dashboard/student' : '/dashboard/teacher'} /> :
                                <Signup />
                        } />
                        <Route path="/chapter/:chapterId" element={<EnhancedChapterView />} />
                        <Route path="/quiz/:quizId" element={<QuizView />} />
                        <Route path="/learning" element={<Learning />} />
                        <Route path="/dashboard/student" element={
                            authState.isAuthenticated && authState.userRole === 'student' ? 
                                <StudentDashboard /> : 
                                <Navigate to="/login" />
                        } />
                        <Route path="/dashboard/teacher" element={
                            authState.isAuthenticated && authState.userRole === 'teacher' ? 
                                <TeacherDashboard /> : 
                                <Navigate to="/login" />
                        } />
                        <Route path="/profile" element={
                            authState.isAuthenticated ? 
                                <Profile /> : 
                                <Navigate to="/login" />
                        } />
                        <Route path="/" element={
                            authState.isAuthenticated ?
                                <Navigate to={authState.userRole === 'student' ? '/dashboard/student' : '/dashboard/teacher'} /> :
                                <Home />
                        } />
                    </Routes>
                </MainLayout>
            </div>
        </BrowserRouter>
    );
};

export default App;
