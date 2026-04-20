import React, { useState, useEffect } from 'react';
import { brands, defaultBrandKey } from './config/branding.js';
import HomePage from './pages/HomePage.jsx';
import FormPage from './pages/FormPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import { getRecords } from './lib/storage.js';

// ── Theme toggle (persisted) ──────────────────────
function getInitialTheme() {
  const stored = localStorage.getItem('mmp-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [tab, setTab]         = useState('new');
  const [brandKey, setBrandKey] = useState(defaultBrandKey);
  const [records, setRecords] = useState(() => getRecords());
  const [theme, setTheme]     = useState(getInitialTheme);

  const brand = brands[brandKey];

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mmp-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const moonIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );

  const sunIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );

  return (
    <div className="app-shell">

      {/* ── Primary nav header ── */}
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-logo-wrap">
            <img
              src={brand.logoLight}
              alt={brand.companyName}
              className="brand-logo brand-logo--light"
            />
            <img
              src={brand.logoDark}
              alt={brand.companyName}
              className="brand-logo brand-logo--dark"
            />
          </div>

          <p className="header-title">{brand.appName}</p>

          <div className="header-actions">
            <button
              className="theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? sunIcon : moonIcon}
            </button>
          </div>
        </div>
      </header>

      {/* ── Brand selector + tab row ── */}
      <div className="sub-header">
        <div className="sub-header-inner">
          <div className="brand-select-wrap">
            <label htmlFor="brand-select">Brand</label>
            <select
              id="brand-select"
              value={brandKey}
              onChange={(e) => setBrandKey(e.target.value)}
              className="brand-select"
            >
              <option value="matthewmunzell">Matthew Munzell Photography</option>
              <option value="expired">Expired Film Photography</option>
              <option value="flightline">Flight Line Photo</option>
            </select>
          </div>

          <nav className="tab-row">
            <button
              className={tab === 'new' ? 'tab active' : 'tab'}
              onClick={() => setTab('new')}
            >
              New Release
            </button>
            <button
              className={tab === 'history' ? 'tab active' : 'tab'}
              onClick={() => setTab('history')}
            >
              History
            </button>
          </nav>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="content-shell">
        {tab === 'new' ? (
          <>
            <HomePage companyName={brand.companyName} />
            <FormPage
              brand={brand}
              onSaved={() => { setRecords(getRecords()); setTab('history'); }}
            />
          </>
        ) : (
          <HistoryPage records={records} onChanged={() => setRecords(getRecords())} />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <span>{brand.companyName} &mdash; Release Form</span>
        <span>v{brand.version}</span>
      </footer>
    </div>
  );
}
