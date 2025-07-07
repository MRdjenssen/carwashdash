import React from "react";
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TabletView from './TabletView.jsx';
import AdminPanel from './AdminPanel.jsx';

function App() {
  const isAdmin = window.location.pathname === '/admin';
  if (isAdmin) return <AdminPanel />;
  return <TabletView />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
