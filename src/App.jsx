import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAuth, isAuthenticated as checkAuth, setAuthToken, removeAuthToken } from './utils/auth';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import LandingPage from './components/LandingPage/LandingPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import TutorPage from './components/Tutor/TutorPage';
import TutorAvailability from './components/Tutor/TutorAvailability';
import TutorBookings from './components/Tutor/TutorBookings';
import './styles/App.css';
import './styles/Auth.css';
import './styles/Dashboard.css';
import './styles/LandingPage.css';
import './styles/TutorPage.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding token');
      return null;
    }
  };

  useEffect(() => {
    const initAuth = () => {
      const token = initializeAuth();
      if (!token) {
        setLoading(false);
        return;
      }

      setAuthToken(token);
      const decoded = decodeToken(token);

      if (decoded) {
        const role = (decoded.role || (decoded.roles?.[0]) || 'user').toLowerCase();
        setUser({
          id: decoded.userId || decoded.sub,
          email: decoded.email,
          role: role,
        });
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = (userData, token) => {
    setAuthToken(token);
    setUser(userData);
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
  };
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/signup"
            element={
              checkAuth() ?
                <Navigate to="/dashboard" replace /> :
                <Signup onLogin={handleLogin} />
            }
          />
          <Route
            path="/login"
            element={
              checkAuth() ?
                <Navigate to="/dashboard" replace /> :
                <Login onLogin={handleLogin} />
            }
          />
          <Route
            path="/register"
            element={
              checkAuth() ?
                <Navigate to="/dashboard" replace /> :
                <Signup onLogin={handleLogin} />
            }
          />
          <Route
            path="/tutor"
            element={
              checkAuth() ?
                <Navigate to="/dashboard" replace /> :
                <TutorPage />
            }
          />
          <Route
            path="/tutor/availability"
            element={
              <ProtectedRoute>
                <TutorAvailability />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor/bookings"
            element={
              <ProtectedRoute>
                <TutorBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/" 
            element={
              checkAuth() ? 
                <Navigate to="/dashboard" replace /> : 
                <LandingPage />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;