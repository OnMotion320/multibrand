import React, { useMemo, useState } from 'react';
import { deleteRecord } from '../lib/storage.js';
import { generatePdf } from '../lib/pdf.js';
import { displayNameForRecord, labelForType } from '../lib/utils.js';

export default function HistoryPage({ records, onChanged }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [
        displayNameForRecord(r),
        r.email,
        r.phone,
        r.projectName,
        r.shootDescription,
        r.shootLocation,
        r.shootDate,
        labelForType(r.releaseType)
      ].join(' ').toLowerCase().includes(q)
    );
  }, [records, query]);

  const redownload = async (record) => {
    try {
      const { doc, filename } = await generatePdf(record);
      doc.save(filename);
    } catch {
      alert('Unable to regenerate the PDF.');
    }
  };

  const remove = (id) => {
    if (!window.confirm('Delete this saved release?')) return;
    deleteRecord(id);
    onChanged();
  };

  return (
    <section className="card history-card">
      <div className="history-header">
        <div>
          <h2>Saved releases</h2>
          <p>Stored locally in this browser.</p>
        </div>
        <input
          className="search-input"
          placeholder="Search name, type, date, location, or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No saved releases yet</h3>
          <p>Your completed releases will appear here after you save one.</p>
        </div>
      ) : (
        <div className="history-list">
          {filtered.map((record) => (
            <article className="history-item" key={record.id}>
              <div>
                <h3>{displayNameForRecord(record)}</h3>
                <p>{labelForType(record.releaseType)}</p>
                <p>{record.shootLocation}</p>
                <p>{new Date(record.createdAt).toLocaleString()}</p>
              </div>
              <div className="history-actions">
                <button className="secondary-button" type="button" onClick={() => redownload(record)}>Download PDF</button>
                <button className="danger-button" type="button" onClick={() => remove(record.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
