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
