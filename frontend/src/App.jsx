import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavbarComponent from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import './App.css';

function AppRoutes() {
  useLocation();
  const token = localStorage.getItem('token');
  const role = JSON.parse(localStorage.getItem('user') || 'null')?.role;
  const isManager = role === 'Admin' || role === 'Staff';
  const homeRoute = isManager ? '/dashboard' : '/rooms';

  return (
    <div className="app-shell">
      <NavbarComponent />
      <Routes>
        <Route path="/" element={<Navigate to={token ? homeRoute : '/login'} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={token ? isManager ? <main className="app-main container-fluid"><Dashboard /></main> : <Navigate to="/rooms" replace /> : <Navigate to="/login" replace />} />
        <Route path="/rooms" element={token ? <main className="app-main container-fluid"><Rooms /></main> : <Navigate to="/login" replace />} />
        <Route path="/bookings" element={token ? <main className="app-main container-fluid"><Bookings /></main> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return <Router><AppRoutes /></Router>;
}

export default App;
