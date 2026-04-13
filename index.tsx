import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(r => console.log('[Edunet] SW enregistré:', r.scope))
      .catch(e => console.error('[Edunet] SW échec:', e));
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('[Edunet] #root introuvable');
ReactDOM.createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
