import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar     from './components/Navbar';
import Register   from './pages/Register';
import Login      from './pages/Login';
import Analyzer   from './pages/Analyzer';
import History    from './pages/History';
import AdminDash  from './pages/AdminDash';

function PrivateRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  // Allow both admin and superadmin
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/analyzer" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"         element={<Navigate to={user ? "/analyzer" : "/login"} replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/analyzer" element={<Analyzer />} />
        <Route path="/history"  element={<PrivateRoute><History /></PrivateRoute>} />
        <Route path="/admin"    element={<AdminRoute><AdminDash /></AdminRoute>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
