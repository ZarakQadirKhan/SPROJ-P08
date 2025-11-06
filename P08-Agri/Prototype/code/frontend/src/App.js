import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import InspectorDashboard from './pages/dashboard/InspectorDashboard'; // inspector view (renamed)
import FarmerDashboard from './pages/dashboard/FarmerDashboard';
import './App.css';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  const RoleRedirect = () => {
    const user_json = localStorage.getItem('user') || '{}';
    const user = JSON.parse(user_json);
    if (!user || !user.role) return <Navigate to="/login" />;
    if (user.role === 'farmer') return <Navigate to="/farmer-dashboard" />;
    if (user.role === 'inspector') return <Navigate to="/inspector-dashboard" />;
    return <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              {/* Role-based redirect: sends user to farmer or inspector dashboard */}
              <RoleRedirect />
            </PrivateRoute>
          }
        />
        <Route
          path="/farmer-dashboard"
          element={<PrivateRoute><FarmerDashboard /></PrivateRoute>}
        />

        <Route
          path="/inspector-dashboard"
          element={<PrivateRoute><InspectorDashboard /></PrivateRoute>}
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
