// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ element, roles }) {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('userRole');
  console.log('ProtectedRoute - Token:', token, 'Role:', userRole);

  if (!token || !userRole) {
    console.log('No token or role, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(userRole)) {
    console.log(`Role ${userRole} not allowed for this route, redirecting to /login`);
    return <Navigate to="/login" replace />;
  }

  return element;
}

export default ProtectedRoute;