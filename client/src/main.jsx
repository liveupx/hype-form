import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1c1917',
            color: '#fafaf9',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fafaf9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fafaf9',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
