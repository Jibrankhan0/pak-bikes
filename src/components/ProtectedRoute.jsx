import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, profile, emailVerified, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: '#25d366 transparent transparent transparent' }} />
          <p className="text-on-surface-variant font-bold text-sm uppercase tracking-widest">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not logged in at all
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is logged in but profile is not setup, redirect to onboarding 
  // ONLY IF they aren't already on the onboarding page
  if (profile && !profile.onboarded && location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

export default ProtectedRoute;
