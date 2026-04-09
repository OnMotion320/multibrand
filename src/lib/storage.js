const STORAGE_KEY = 'release-form-app-records-v4';

export function getRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecord(record) {
  const records = getRecords();
  records.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function deleteRecord(id) {
  const records = getRecords().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
