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

const periodTabs = [
  { id: "daily", label: "Dagelijks" },
  { id: "weekly", label: "Wekelijks" },
  { id: "bimonthly", label: "Tweewekelijks" },
  { id: "monthly", label: "Maandelijks" },
  { id: "yearly", label: "Jaarlijks" },
];
const dayBlocks = ["ochtend", "middag", "avond"];
const kennisbankCategoriesDefault = ["Algemeen", "Materiaal", "Personeel"];

export default function AdminPanel() {
  // --- AUTH ---
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setChecking(false);
    });
    return unsub;
  }, []);

  if (checking) return <div className="p-10">Bezig met inloggen...</div>;
  if (!user) return <div className="p-10 text-red-600">Niet ingelogd. Log eerst in als admin.</div>;
}
