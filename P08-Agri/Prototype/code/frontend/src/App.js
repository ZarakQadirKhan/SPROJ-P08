import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import FarmerDashboard from './pages/dashboard/FarmerDashboard';
import ContactSupport from './pages/support/ContactSupport';
import './App.css';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const getUserRole = () => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    try {
      const user = JSON.parse(userJson);
      return user.role || null;
    } catch {
      return null;
    }
  };

  const PrivateRoute = ({ children, allowedRoles }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" />;
    }
    
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = getUserRole();
      if (!allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        if (userRole === 'farmer') {
          return <Navigate to="/farmer-dashboard" />;
        } else if (userRole === 'inspector') {
          return <Navigate to="/inspector-dashboard" />;
        } else {
          return <Navigate to="/dashboard" />;
        }
      }
    }
    
    return children;
  };

  const DashboardRedirect = () => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" />;
    }
    
    const userRole = getUserRole();
    if (userRole === 'farmer') {
      return <Navigate to="/farmer-dashboard" />;
    } else if (userRole === 'inspector') {
      return <Navigate to="/inspector-dashboard" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={<DashboardRedirect />}
        />
        <Route
          path="/farmer-dashboard"
          element={
            <PrivateRoute allowedRoles={['farmer']}>
              <FarmerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/inspector-dashboard"
          element={
            <PrivateRoute allowedRoles={['inspector', 'admin']}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/contact-support"
          element={
            <PrivateRoute>
              <ContactSupport />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
