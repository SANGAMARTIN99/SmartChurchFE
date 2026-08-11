import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './i18n';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Revision note [2026-07-13 09:43:48 +0300]: Enhance form input validation and feedback

// Revision note [2026-07-27 14:32:38 +0300]: Update broadcast announcement modal layout

// Revision note [2026-08-10 18:23:16 +0300]: Refactor pending post review modal flow

// Activity update [2026-07-12 11:14:08 +0300]: Enhance form input validation and feedback

// Activity update [2026-07-22 20:59:33 +0300]: Refactor route guards and auth check hooks

// Activity update [2026-08-02 12:59:42 +0300]: Update button hover states and active indicators

// Activity update [2026-08-11 18:20:29 +0300]: Optimize tab selection state management
