

import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// Lightweight lazy initializer for Firebase. This file deliberately avoids
// importing heavy firebase/* modules at module-eval time so they are only
// loaded when actually needed (reduces main-thread blocking and bundle size).

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type Cached = {
    initialized: boolean;
    app: FirebaseApp | null;
    auth: Auth | null;
    db: Firestore | null;
    googleProvider: any | null;
};

const cached: Cached = { initialized: false, app: null, auth: null, db: null, googleProvider: null };

/**
 * Ensure Firebase SDKs are loaded and initialized. This does a dynamic import
 * of only the submodules we need and caches the references.
 */
export async function ensureFirebaseInitialized(): Promise<Cached> {
    if (cached.initialized) return cached;
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        // Not configured; leave cached as uninitialized but harmlessly empty
        cached.initialized = true;
        return cached;
    }

    try {
        const { initializeApp, getApps } = await import('firebase/app');
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

        // Import auth and firestore lazily
        const [{ getAuth, GoogleAuthProvider }, { getFirestore }] = await Promise.all([
            import('firebase/auth'),
            import('firebase/firestore'),
        ]);

        cached.app = app as unknown as FirebaseApp;
        cached.auth = getAuth(cached.app) as unknown as Auth;
        cached.db = getFirestore(cached.app) as unknown as Firestore;
        cached.googleProvider = new (GoogleAuthProvider as any)();
        cached.initialized = true;
        return cached;
    } catch (e) {
        // If any dynamic import fails, mark initialized to avoid retry storms; callers
        // should handle missing db/auth gracefully.
        console.warn('[firebase-config] dynamic initialization failed', e);
        cached.initialized = true;
        return cached;
    }
}

/**
 * Returns the Firestore instance or null if Firebase not configured.
 */
export async function getDb(): Promise<Firestore | null> {
    const c = await ensureFirebaseInitialized();
    return c.db;
}

/**
 * Returns the Auth instance or null.
 */
export async function getAuthInstance(): Promise<Auth | null> {
    const c = await ensureFirebaseInitialized();
    return c.auth;
}

/**
 * Returns the cached GoogleAuthProvider (or null).
 */
export async function getGoogleProvider(): Promise<any | null> {
    const c = await ensureFirebaseInitialized();
    return c.googleProvider;
}

/**
 * For compatibility in places that previously imported the module dynamically
 * (e.g. auth-context uses `await import('@/lib/firebase-config')`), expose
 * a small helper that returns the current cached values.
 */
export async function getFirebaseExports() {
    const c = await ensureFirebaseInitialized();
    return { app: c.app, auth: c.auth, db: c.db, googleProvider: c.googleProvider };
}
