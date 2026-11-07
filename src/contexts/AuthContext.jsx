import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Admin status is data-driven (an `admins/{email}` doc), not a hardcoded
  // list, so it's checked live against Firestore whenever the user changes.
  useEffect(() => {
    if (user === undefined) return; // auth state not resolved yet
    if (!user?.email) {
      setIsAdmin(false);
      setAdminProfile(null);
      setAdminLoading(false);
      return;
    }
    setAdminLoading(true);
    const ref = doc(db, 'admins', user.email.toLowerCase());
    return onSnapshot(
      ref,
      (snap) => {
        setIsAdmin(snap.exists());
        setAdminProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setAdminLoading(false);
      },
      () => {
        setIsAdmin(false);
        setAdminProfile(null);
        setAdminLoading(false);
      }
    );
  }, [user]);

  const value = {
    user: user ?? null,
    loading: user === undefined || adminLoading,
    isAdmin,
    adminProfile,
    signIn: () => signInWithPopup(auth, googleProvider),
    signOutUser: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
