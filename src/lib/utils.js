export function labelForType(type) {
  if (type === 'minor') return 'Minor Model Release';
  if (type === 'property') return 'Property Release';
  return 'Model Release';
}

export function displayNameForRecord(form) {
  if (form.releaseType === 'minor') return form.minorName || form.guardianName || 'Minor Release';
  if (form.releaseType === 'property') return form.propertyName || form.signerName || 'Property Release';
  return form.signerName || 'Model Release';
}
