import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { ToastProvider } from './src/context/ToastContext';
import './src/styles/main.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);