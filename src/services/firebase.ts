
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVV_2-Jfi6yWOmlNeFAn3KlhmPHO1Y-ew",
  authDomain: "news-c97d6.firebaseapp.com",
  projectId: "news-c97d6",
  storageBucket: "news-c97d6.firebasestorage.app",
  messagingSenderId: "123459649936",
  appId: "1:123459649936:web:53c1287c342ba12fe8b315",
  measurementId: "G-CJMB9F3EY5"
};

// Check if Firebase app is already initialized
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If app is already initialized, use the existing instance
  app = initializeApp();
}

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
