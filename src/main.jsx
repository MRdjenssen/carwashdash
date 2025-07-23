import './index.css';
import React, { useState, useEffect } from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TabletView from './TabletView.jsx';
import AdminPanel from './AdminPanel.jsx';
import AdminLogin from './AdminLogin.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from './firebaseConfig';

const auth = getAuth(app);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdminPath = window.location.pathname === '/admin';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  if (isAdminPath) {
    return <AdminPanel />;
  }

  if (user) {
    return <TabletView />;
  }

  return <AdminLogin onLogin={() => window.location.reload()} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
