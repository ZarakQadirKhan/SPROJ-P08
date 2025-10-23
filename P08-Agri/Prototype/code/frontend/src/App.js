import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";

function FarmerDashboard() {
  return <div style={{ padding: 24 }}>Farmer Dashboard</div>;
}

function InspectorDashboard() {
  return <div style={{ padding: 24 }}>Inspector Dashboard</div>;
}

function Dashboard() {
  return <div style={{ padding: 24 }}>General Dashboard</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
        <Route path="/inspector-dashboard" element={<InspectorDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
