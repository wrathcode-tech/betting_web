import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Defer so it doesn't compete with initial render
if (typeof window !== 'undefined' && window.requestIdleCallback) {
  window.requestIdleCallback(() => reportWebVitals(), { timeout: 2000 });
} else {
  setTimeout(() => reportWebVitals(), 100);
}
