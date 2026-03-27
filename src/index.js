import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
// StrictMode intentionally off: in React 18 dev it runs effects twice → duplicate API calls on every page.
root.render(<App />);

// Defer so it doesn't compete with initial render
if (typeof window !== 'undefined' && window.requestIdleCallback) {
  window.requestIdleCallback(() => reportWebVitals(), { timeout: 2000 });
} else {
  setTimeout(() => reportWebVitals(), 100);
}
