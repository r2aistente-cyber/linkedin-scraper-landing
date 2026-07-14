// lib/json.js — exportar perfiles a JSON

export function exportJSON(profiles) {
  const json = JSON.stringify(profiles, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `linkedin_profiles_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
