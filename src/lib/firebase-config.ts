
import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

// Gracefully handle missing Firebase config to prevent app crashes.
// The app will run, but Firebase-dependent features will be disabled.
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
} else {
    console.warn("Firebase config is missing in your .env file. Firebase features (login, cloud save) will be disabled.");
    // Provide mock/dummy objects to prevent app crash when config is missing
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
    googleProvider = {} as GoogleAuthProvider;
}


export { app, auth, db, googleProvider };
