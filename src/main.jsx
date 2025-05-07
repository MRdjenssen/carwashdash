import './index.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import TabletView from './TabletView.jsx';
import AdminLogin from './AdminLogin.jsx';
import AdminPanel from './AdminPanel.jsx';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const isAdmin = window.location.pathname === '/admin';

  if (isAdmin && !loggedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  }

  if (isAdmin && loggedIn) {
    return <AdminPanel />;
  }

  return <TabletView />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
