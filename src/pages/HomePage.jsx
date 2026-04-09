import React from 'react';

export default function HomePage({ companyName }) {
  return (
    <section className="card intro-card">
      <h2>Create a new release</h2>
      <p>Use this release workflow for {companyName}. Select the release type, attach reference images, capture a signature, and save a polished PDF for your records.</p>
    </section>
  );
}
