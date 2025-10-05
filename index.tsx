// FIX: Import React and ReactDOM. These are required in a module-based environment
// to resolve the 'refers to a UMD global' and 'createRoot does not exist' errors.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);