import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from "./firebaseConfig";

const auth = getAuth(app);

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      onLogin();
    } catch (err) {
      setError("Fout bij inloggen: " + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <input
          type="email"
          className="w-full mb-3 p-2 border rounded"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full mb-3 p-2 border rounded"
          placeholder="Wachtwoord"
          value={pw}
          onChange={e => setPw(e.target.value)}
          required
        />
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <button
          type="submit"
          className="w-full py-2 bg-green-700 text-white rounded font-semibold"
          disabled={submitting}
        >
          {submitting ? "Inloggen..." : "Inloggen"}
        </button>
      </form>
    </div>
  );
}
