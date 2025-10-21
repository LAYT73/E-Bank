import React, { type JSX } from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: JSX.Element;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // TODO: Replace with actual authentication logic
  const isAuthenticated = localStorage.getItem('auth_token') !== null;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
