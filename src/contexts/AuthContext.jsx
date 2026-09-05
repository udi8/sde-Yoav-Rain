import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { isAdminEmail } from '../config/admins';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const value = {
    user: user ?? null,
    loading: user === undefined,
    isAdmin: !!user && isAdminEmail(user.email),
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
