import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "agencia-gestao-26270.firebaseapp.com",
  projectId: "agencia-gestao-26270",
  storageBucket: "agencia-gestao-26270.firebasestorage.app",
  messagingSenderId: "266897235703",
  appId: "1:266897235703:web:821f0242278b73839b3df2"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
