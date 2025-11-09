'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
// Note: firebase is dynamically imported at runtime to avoid inflating the client bundle
// when Firebase is not configured or when auth features are not used.


interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const init = async () => {
      try {
        const fc = await import('@/lib/firebase-config');
        if (!fc || !fc.auth) {
          setIsFirebaseConfigured(false);
          setLoading(false);
          return;
        }
        setIsFirebaseConfigured(true);
        const { onAuthStateChanged } = await import('firebase/auth');
        unsub = onAuthStateChanged(fc.auth as any, (u: any) => {
          setUser(u);
          setLoading(false);
        });
      } catch {
        // If anything fails, treat as not configured
        setLoading(false);
      }
    };
    init();
    return () => {
      try { if (typeof unsub === 'function') unsub(); } catch {};
    };
  }, []);

  const login = async () => {
    try {
      const fc = await import('@/lib/firebase-config');
      if (!fc || !fc.auth || !fc.googleProvider) {
        console.error('Firebase is not configured. Cannot log in.');
        return;
      }
      const { signInWithPopup } = await import('firebase/auth');
      await signInWithPopup(fc.auth as any, fc.googleProvider as any);
    } catch (error: any) {
      console.error('Error during sign-in:', error);
    }
  };

  const logout = async () => {
    try {
      const fc = await import('@/lib/firebase-config');
      if (!fc || !fc.auth) {
        console.error('Firebase is not configured. Cannot log out.');
        return;
      }
      const { signOut } = await import('firebase/auth');
      await signOut(fc.auth as any);
    } catch (error: any) {
      console.error('Error during sign-out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
