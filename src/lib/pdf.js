import { jsPDF } from 'jspdf';
import { labelForType } from './utils.js';

async function fetchPngDataUrl(path) {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function wrap(doc, text, x, y, width, lineHeight = 5.5) {
  const lines = doc.splitTextToSize(text || '—', width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function buildReleaseId(form) {
  const datePart = (form.shootDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');
  const namePart = (form.releaseType === 'minor' ? form.minorName : (form.propertyName || form.signerName || 'release'))
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();
  return `RLS-${datePart}-${namePart || 'FORM'}`;
}

function stampAllPages(doc, meta) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.setDrawColor(220);
    doc.line(15, 15, 200, 15);
    doc.text(meta.releaseLabel, 15, 11);
    doc.text(meta.subjectLabel, 105, 11, { align: 'center' });
    doc.text(meta.releaseId, 200, 11, { align: 'right' });

    doc.line(15, 268, 200, 268);
    doc.text(meta.companyName, 15, 274);
    doc.text(`Generated ${meta.generatedAt}`, 105, 274, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, 200, 274, { align: 'right' });
  }
}

export async function generatePdf(form) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const margin = 15;
  let y = 22;

  const companyName = form.brandCompanyName || 'Release Form App';
  const logoPath = form.brandLogoPath || '/logo-expired.png';
  const logoData = await fetchPngDataUrl(logoPath);
  const generatedAt = new Date().toLocaleString();
  const releaseLabel = labelForType(form.releaseType);
  const subjectLabel = form.releaseType === 'minor'
    ? (form.minorName || 'Minor Release')
    : (form.propertyName || form.signerName || 'Release');
  const releaseId = buildReleaseId(form);

  if (logoData) {
    doc.addImage(logoData, 'PNG', margin, y - 4, 42, 12);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(companyName, logoData ? 62 : margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(releaseLabel, logoData ? 62 : margin, y + 6);
  doc.text(`Generated: ${generatedAt}`, 135, y + 6);

  y += 16;
  doc.setDrawColor(210);
  doc.line(margin, y, 200, y);
  y += 8;

  const rows = [
    ['Release ID', releaseId],
    ['Release type', releaseLabel],
    ['Photographer', form.photographerName],
    ['Company', companyName],
    ['Shoot date', form.shootDate],
    ['Shoot location', form.shootLocation],
    ['Shoot description', form.shootDescription]
  ];

  if (form.releaseType === 'model') {
    rows.push(['Model full legal name', form.signerName]);
    rows.push(['Email', form.email]);
    rows.push(['Phone', form.phone]);
    rows.push(['Address', form.address]);
  }

  if (form.releaseType === 'minor') {
    rows.push(['Minor full legal name', form.minorName]);
    rows.push(['Minor birth date', form.minorDob]);
    rows.push(['Guardian name', form.guardianName]);
    rows.push(['Relationship', form.guardianRelationship]);
    rows.push(['Guardian email', form.email]);
    rows.push(['Guardian phone', form.phone]);
    rows.push(['Address', form.address]);
  }

  if (form.releaseType === 'property') {
    rows.push(['Property name / address', form.propertyName]);
    rows.push(['Owner / rep', form.signerName]);
    rows.push(['Email', form.email]);
    rows.push(['Phone', form.phone]);
    rows.push(['Address', form.address]);
  }

  doc.setFontSize(11);
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, y, { maxWidth: 52 });
    doc.setFont('helvetica', 'normal');
    y = wrap(doc, value, 72, y, 123);
    y += 2;
    if (y > 240) {
      doc.addPage();
      y = 22;
    }
  }

  if (form.idVerifiedNote) {
    doc.setFont('helvetica', 'bold');
    doc.text('ID verification note:', margin, y, { maxWidth: 52 });
    doc.setFont('helvetica', 'normal');
    y = wrap(doc, form.idVerifiedNote, 72, y, 123);
    y += 2;
  }

  y += 4;
  if (y > 235) {
    doc.addPage();
    y = 22;
  }
  doc.setFont('helvetica', 'bold');
  doc.text('Release Terms', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  y = wrap(doc, form.releaseTerms, margin, y, 180);

  if (y > 225) {
    doc.addPage();
    y = 22;
  } else {
    y += 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Accepted Terms', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(form.acceptedTerms ? 'Yes' : 'No', 72, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text(form.releaseType === 'minor' ? 'Parent / Guardian Signature' : 'Signature', margin, y);
  y += 4;
  doc.setDrawColor(180);
  doc.line(margin, y + 18, 95, y + 18);

  if (form.signatureDataUrl) {
    doc.addImage(form.signatureDataUrl, 'PNG', margin, y, 70, 18, undefined, 'FAST');
  }

  if (form.photoDataUrl) {
    doc.addPage();
    let py = 22;
    if (logoData) {
      doc.addImage(logoData, 'PNG', margin, py - 4, 42, 12);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Visual Reference', logoData ? 62 : margin, py);
    py += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Attached reference photo for identification / review.', margin, py);
    py += 8;
    const imageType = form.photoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    doc.addImage(form.photoDataUrl, imageType, margin, py, 180, 120, undefined, 'FAST');
  }

  if (form.includeIdInPdf && (form.idFrontDataUrl || form.idBackDataUrl)) {
    doc.addPage();
    let iy = 22;
    if (logoData) {
      doc.addImage(logoData, 'PNG', margin, iy - 4, 42, 12);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Identification Reference', logoData ? 62 : margin, iy);
    iy += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Optional ID images retained for internal verification records.', margin, iy);
    iy += 10;

    if (form.idFrontDataUrl) {
      doc.setFont('helvetica', 'bold');
      doc.text('ID front', margin, iy);
      iy += 6;
      const frontType = form.idFrontDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(form.idFrontDataUrl, frontType, margin, iy, 85, 54, undefined, 'FAST');
    }

    if (form.idBackDataUrl) {
      doc.setFont('helvetica', 'bold');
      doc.text('ID back', 110, iy - 6);
      const backType = form.idBackDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(form.idBackDataUrl, backType, 110, iy, 85, 54, undefined, 'FAST');
    }
  }

  stampAllPages(doc, { generatedAt, releaseLabel, subjectLabel, releaseId, companyName });

  const nameBase = (form.releaseType === 'minor' ? form.minorName : (form.propertyName || form.signerName || 'release'))
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '');
  const safeDate = (form.shootDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, '');
  const filename = `${form.releaseType}_${nameBase || 'release'}_${safeDate || 'form'}.pdf`;

  return { doc, filename };
}
