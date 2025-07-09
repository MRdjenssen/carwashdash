import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import app from "./firebaseConfig";
import dayjs from "dayjs";

const db = getFirestore(app);
const auth = getAuth(app);

export default function AdminPanel() {
  return <div>Test werkt 2</div>;
}
