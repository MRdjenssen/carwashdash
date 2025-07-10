import './index.css';
import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TabletView from './TabletView.jsx';
import AdminPanel from './AdminPanel.jsx';

function App() {
  const isAdmin = window.location.pathname === '/admin';
  return (
    <>
      <div style={{ display: isAdmin ? 'block' : 'none' }}>
        <AdminPanel />
      </div>
      <div style={{ display: !isAdmin ? 'block' : 'none' }}>
        <TabletView />
      </div>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
