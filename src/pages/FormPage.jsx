import React, { useMemo, useState } from 'react';
import SignaturePad from '../components/SignaturePad.jsx';
import { getReleaseTerms } from '../data/releaseTerms.js';
import { generatePdf } from '../lib/pdf.js';
import { saveRecord } from '../lib/storage.js';

const buildBlankForm = (brand) => ({
  brandKey: brand.key,
  brandCompanyName: brand.companyName,
  brandLogoPath: brand.logoPath,
  releaseType: 'model',
  photographerName: brand.photographerDefaultName,
  signerName: '',
  minorName: '',
  minorDob: '',
  guardianName: '',
  guardianRelationship: '',
  propertyName: '',
  email: '',
  phone: '',
  address: '',
  shootDate: new Date().toISOString().slice(0, 10),
  shootLocation: '',
  shootDescription: '',
  photoDataUrl: '',
  idFrontDataUrl: '',
  idBackDataUrl: '',
  idVerifiedNote: '',
  includeIdInPdf: false,
  notes: '',
  releaseTerms: getReleaseTerms(brand.companyName).model,
  acceptedTerms: false,
  signatureDataUrl: ''
});

async function fileToDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function FormPage({ brand, onSaved }) {
  const termsByType = useMemo(() => getReleaseTerms(brand.companyName), [brand.companyName]);
  const [form, setForm] = useState(buildBlankForm(brand));
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setForm((current) => ({
      ...buildBlankForm(brand),
      releaseType: current.releaseType,
      releaseTerms: termsByType[current.releaseType]
    }));
  }, [brand, termsByType]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const changeReleaseType = (type) => {
    setForm((current) => ({
      ...current,
      releaseType: type,
      releaseTerms: termsByType[type]
    }));
  };

  const validate = () => {
    const errors = [];
    if (!form.photographerName.trim()) errors.push('Photographer name is required.');
    if (!form.shootDate.trim()) errors.push('Shoot date is required.');
    if (!form.shootLocation.trim()) errors.push('Shoot location is required.');
    if (!form.shootDescription.trim()) errors.push('Shoot description is required.');
    if (!form.email.trim()) errors.push('Email is required.');
    if (!form.acceptedTerms) errors.push('You must accept the release terms.');
    if (!form.signatureDataUrl) errors.push('Signature is required.');

    if (form.releaseType === 'model') {
      if (!form.signerName.trim()) errors.push('Model full legal name is required.');
    }
    if (form.releaseType === 'minor') {
      if (!form.minorName.trim()) errors.push('Minor full legal name is required.');
      if (!form.guardianName.trim()) errors.push('Parent / guardian full legal name is required.');
      if (!form.guardianRelationship.trim()) errors.push('Relationship to minor is required.');
    }
    if (form.releaseType === 'property') {
      if (!form.propertyName.trim()) errors.push('Property name / address is required.');
      if (!form.signerName.trim()) errors.push('Owner / authorized representative name is required.');
    }

    if (errors.length) {
      alert(errors.join('\n'));
      return false;
    }
    return true;
  };

  const onPhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    update('photoDataUrl', dataUrl);
  };

  const onIdFrontChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    update('idFrontDataUrl', dataUrl);
  };

  const onIdBackChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    update('idBackDataUrl', dataUrl);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        brandKey: brand.key,
        brandCompanyName: brand.companyName,
        brandLogoPath: brand.logoPath
      };
      const { doc, filename } = await generatePdf(payload);
      const record = {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      saveRecord(record);
      doc.save(filename);
      onSaved();
      setForm(buildBlankForm(brand));
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Something went wrong while generating the PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="release-type-row">
        <button type="button" className={form.releaseType === 'model' ? 'chip active' : 'chip'} onClick={() => changeReleaseType('model')}>Model</button>
        <button type="button" className={form.releaseType === 'minor' ? 'chip active' : 'chip'} onClick={() => changeReleaseType('minor')}>Minor</button>
        <button type="button" className={form.releaseType === 'property' ? 'chip active' : 'chip'} onClick={() => changeReleaseType('property')}>Property</button>
      </div>

      <div className="field-grid">
        <label>
          <span>Photographer name</span>
          <input value={form.photographerName} onChange={(e) => update('photographerName', e.target.value)} />
        </label>

        <label className="field-span-2">
  <span>Shoot date</span>
  <input type="date" value={form.shootDate} onChange={(e) => update('shootDate', e.target.value)} />
</label>

        <label className="field-span-2">
          <span>Shoot location</span>
          <input value={form.shootLocation} onChange={(e) => update('shootLocation', e.target.value)} />
        </label>

        <label className="field-span-2">
          <span>Shoot description</span>
          <textarea rows="3" value={form.shootDescription} onChange={(e) => update('shootDescription', e.target.value)} />
        </label>

        {form.releaseType === 'model' && (
          <label className="field-span-2">
            <span>Model full legal name</span>
            <input value={form.signerName} onChange={(e) => update('signerName', e.target.value)} />
          </label>
        )}

        {form.releaseType === 'minor' && (
          <>
            <label className="field-span-2">
              <span>Minor full legal name</span>
              <input value={form.minorName} onChange={(e) => update('minorName', e.target.value)} />
            </label>

            <label className="field-span-2">
  <span>Minor birth date</span>
  <input type="date" value={form.minorDob} onChange={(e) => update('minorDob', e.target.value)} />
</label>

            <label className="field-span-2">
              <span>Relationship</span>
              <input value={form.guardianRelationship} onChange={(e) => update('guardianRelationship', e.target.value)} />
            </label>

            <label className="field-span-2">
              <span>Parent / guardian full legal name</span>
              <input value={form.guardianName} onChange={(e) => update('guardianName', e.target.value)} />
            </label>
          </>
        )}

        {form.releaseType === 'property' && (
          <>
            <label className="field-span-2">
              <span>Property name / address</span>
              <input value={form.propertyName} onChange={(e) => update('propertyName', e.target.value)} />
            </label>

            <label className="field-span-2">
              <span>Owner / authorized representative</span>
              <input value={form.signerName} onChange={(e) => update('signerName', e.target.value)} />
            </label>
          </>
        )}

        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
        </label>

        <label>
          <span>Phone</span>
          <input
            inputMode="numeric"
            placeholder="000-000-0000"
            value={form.phone}
            onChange={(e) => update('phone', formatPhone(e.target.value))}
          />
        </label>

        <label className="field-span-2">
          <span>Address</span>
          <textarea rows="2" value={form.address} onChange={(e) => update('address', e.target.value)} />
        </label>

        <label className="field-span-2">
          <span>Visual reference photo</span>
          <input type="file" accept="image/*" capture="environment" onChange={onPhotoChange} />
        </label>

        {form.photoDataUrl && (
          <div className="field-span-2 photo-preview-wrap">
            <img src={form.photoDataUrl} alt="Visual reference preview" className="photo-preview" />
          </div>
        )}

        <label className="field-span-2">
          <span>ID / Driver license front (optional)</span>
          <input type="file" accept="image/*" capture="environment" onChange={onIdFrontChange} />
        </label>

        {form.idFrontDataUrl && (
          <div className="field-span-2 photo-preview-wrap">
            <img src={form.idFrontDataUrl} alt="ID front preview" className="photo-preview" />
          </div>
        )}

        <label className="field-span-2">
          <span>ID / Driver license back (optional)</span>
          <input type="file" accept="image/*" capture="environment" onChange={onIdBackChange} />
        </label>

        {form.idBackDataUrl && (
          <div className="field-span-2 photo-preview-wrap">
            <img src={form.idBackDataUrl} alt="ID back preview" className="photo-preview" />
          </div>
        )}

        <label className="field-span-2">
          <span>ID verification notes</span>
          <textarea
            rows="2"
            placeholder="Optional note, such as ID verified in person."
            value={form.idVerifiedNote}
            onChange={(e) => update('idVerifiedNote', e.target.value)}
          />
        </label>

        <label className="field-span-2 checkbox-row">
          <input
            type="checkbox"
            checked={form.includeIdInPdf}
            onChange={(e) => update('includeIdInPdf', e.target.checked)}
          />
          <span>Include ID images in exported PDF</span>
        </label>

        <label className="field-span-2">
          <span>Additional notes</span>
          <textarea rows="3" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
        </label>

        <label className="field-span-2">
          <span>Release terms</span>
          <textarea rows="12" value={form.releaseTerms} onChange={(e) => update('releaseTerms', e.target.value)} />
        </label>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.acceptedTerms}
          onChange={(e) => update('acceptedTerms', e.target.checked)}
        />
        <span>I have read and accept the release terms above, and I am legally authorized to sign this release.</span>
      </label>

      <div className="signature-section">
        <h3>{form.releaseType === 'minor' ? 'Parent / Guardian Signature' : 'Signature'}</h3>
        <SignaturePad value={form.signatureDataUrl} onChange={(value) => update('signatureDataUrl', value)} />
      </div>

      <div className="sticky-actions">
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving...' : 'Save and download PDF'}
        </button>
      </div>
    </form>
  );
}
