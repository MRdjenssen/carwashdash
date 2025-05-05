import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TabletView from './TabletView.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TabletView />
  </StrictMode>
);