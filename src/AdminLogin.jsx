// AdminLogin.jsx – Styled to match updated UI
import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from './firebaseConfig';

const auth = getAuth(app);

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err) {
      setError('Login mislukt: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md">
        <img
          src="https://23g-sharedhosting-grit-wordpress.s3.eu-west-1.amazonaws.com/wp-content/uploads/sites/13/2023/11/30093636/Logo_kort_wit.png"
          alt="Logo"
          className="h-14 mb-4 mx-auto bg-green-600 p-1 rounded"
        />
        <h1 className="text-xl font-bold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full bg-white text-black border border-gray-300 hover:border-green-500 py-2 rounded font-bold"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
