import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import './assets/css/main.css';
import './assets/css/fonts.css';

import App from './pages/App';
import Login from './pages/login';
import TOS from './pages/TOS';
import PrivacyPolicy from './pages/PrivacyPolicy';

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <>
      <Router>
        <Routes>
          <Route exact path="/" element={<App />} />
          <Route exact path="/login" element={<Login />} />
          <Route exact path="/tos" element={<TOS />} />
          <Route exact path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </Router>
    </>
  </StrictMode>
);

