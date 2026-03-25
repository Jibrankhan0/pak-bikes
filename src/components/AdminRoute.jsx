import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const AdminRoute = ({ children }) => {
  const { user, isAdmin, emailVerified, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: '#25d366 transparent transparent transparent' }} />
          <p className="text-on-surface-variant font-bold text-sm uppercase tracking-widest">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin || !emailVerified) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
