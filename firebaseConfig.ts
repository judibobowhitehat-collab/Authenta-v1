import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD630YbDy1LusNHLEq58Q6n3bm-ytcXqFk",
  authDomain: "authenta-9f2a1.firebaseapp.com",
  projectId: "authenta-9f2a1",
  storageBucket: "authenta-9f2a1.firebasestorage.app",
  messagingSenderId: "1033640578680",
  appId: "1:1033640578680:web:ab11b5631f3da1de3fa78d",
  measurementId: "G-NVD0HDPC2P"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);