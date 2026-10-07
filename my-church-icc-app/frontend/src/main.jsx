import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './lib/auth';
import { MetaProvider } from './lib/meta';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MetaProvider>
          <App />
        </MetaProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
