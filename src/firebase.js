import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// 사용자가 제공한 Firebase 웹 앱 접속 설정
const firebaseConfig = {
  apiKey: "AIzaSyBGV15uhAnARzViISKHPnTJapgNEF9eGqo",
  authDomain: "class-tree-program-4911d.firebaseapp.com",
  projectId: "class-tree-program-4911d",
  storageBucket: "class-tree-program-4911d.firebasestorage.app",
  messagingSenderId: "221678896648",
  appId: "1:221678896648:web:82f461dff840790d6db3bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
