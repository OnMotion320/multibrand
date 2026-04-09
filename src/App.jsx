import React, { useState } from 'react';
import { brands, defaultBrandKey } from './config/branding.js';
import HomePage from './pages/HomePage.jsx';
import FormPage from './pages/FormPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import { getRecords } from './lib/storage.js';

export default function App() {
  const [tab, setTab] = useState('new');
  const [brandKey, setBrandKey] = useState(defaultBrandKey);
  const [records, setRecords] = useState(() => getRecords());

  const brand = brands[brandKey];

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand-row">
          <img src={brand.logoPath} alt={brand.companyName} className="brand-logo" />
          <div>
            <h1>{brand.appName}</h1>
            <p>{brand.subtitle}</p>
          </div>
        </div>

        <div className="top-controls">
          <label className="brand-select-wrap">
            <span>Brand</span>
            <select value={brandKey} onChange={(e) => setBrandKey(e.target.value)} className="brand-select">
              <option value="expired">Expired Film Photography</option>
              <option value="flightline">Flight Line Photo</option>
              <option value="matthewmunzell">Matthew Munzell Photography</option>
            </select>
          </label>

          <nav className="tab-row">
            <button className={tab === 'new' ? 'tab active' : 'tab'} onClick={() => setTab('new')}>New Release</button>
            <button className={tab === 'history' ? 'tab active' : 'tab'} onClick={() => setTab('history')}>History</button>
          </nav>
        </div>
      </header>

      <main className="content-shell">
        {tab === 'new' ? (
          <>
            <HomePage companyName={brand.companyName} />
            <FormPage brand={brand} onSaved={() => { setRecords(getRecords()); setTab('history'); }} />
          </>
        ) : (
          <HistoryPage records={records} onChanged={() => setRecords(getRecords())} />
        )}
      </main>

      <footer className="site-footer">
        <span>{brand.companyName}</span>
        <span>Version {brand.version}</span>
      </footer>
    </div>
  );
}
