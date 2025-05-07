// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyBFP1CXboDmXtJ_0htKkrquI5RG3q-8NW8",
  authDomain: "carwashdash-1f60f.firebaseapp.com",
  projectId: "carwashdash-1f60f",
  storageBucket: "carwashdash-1f60f.firebasestorage.app",
  messagingSenderId: "491576094061",
  appId: "1:491576094061:web:ac133ce378019223977e64"
};

const app = initializeApp(firebaseConfig);

export default app;
