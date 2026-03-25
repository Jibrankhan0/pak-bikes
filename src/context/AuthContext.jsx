import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebaseClient';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  const fetchProfile = async (userId) => {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.warn('Profile not found in Firestore');
        setProfile(null);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout: If auth takes more than 3.5s, force stop loading
    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return;
      console.log('Firebase auth state changed:', currentUser?.uid);
      
      setUser(currentUser);
      
      if (currentUser) {
        setEmailVerified(currentUser.emailVerified);
        await fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
        setEmailVerified(false);
      }
      setLoading(false);
      clearTimeout(timer);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser }); // Trigger state update
      setEmailVerified(auth.currentUser.emailVerified);
    }
  };

  const signOut = async () => {
    try {
      console.log('🏁 Starting aggressive logout...');
      
      // 1. Clear local React state immediately for instant UI response
      setLoading(true); // Show loading state if components use it
      setUser(null);
      setProfile(null);
      setEmailVerified(false);

      // 2. Sign out from Firebase (non-blocking for UI)
      firebaseSignOut(auth).catch(err => console.warn('Firebase signout async error:', err));
      
      // 3. Clear all storage
      console.log('🧹 Clearing all local and session storage...');
      window.localStorage.clear();
      window.sessionStorage.clear();
      
      // 4. Force hard reload Document to clean everything
      console.log('🚀 Redirecting and reloading...');
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (err) {
      console.error('❌ Critical logout error fallback:', err);
      setUser(null);
      setProfile(null);
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      isAdmin: profile?.role === 'admin',
      emailVerified, 
      loading, 
      signOut, 
      refreshProfile: () => user && fetchProfile(user.uid),
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
