import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const rootElement = document.getElementById('root');

// DEBUG: Log all fetch requests to see what's crashing
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('FETCH REQUEST:', args[0]);
  try {
    return await originalFetch(...args);
  } catch (e) {
    console.error('FETCH FAILED:', args[0], e);
    throw e;
  }
};

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);