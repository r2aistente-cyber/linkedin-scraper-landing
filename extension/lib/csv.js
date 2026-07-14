// lib/csv.js — exportar perfiles a CSV

const HEADERS = [
  'Name', 'Headline', 'Company', 'Position', 'Location',
  'About', 'Experience', 'Education', 'Skills', 'Languages',
  'Certifications', 'URL', 'Picture', 'Connections', 'ProfileAge',
];

function escapeCSV(val) {
  const s = String(val ?? '').replace(/\r?\n/g, ' ');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function profileToRow(p) {
  return [
    p.name, p.headline, p.company, p.position, p.location,
    p.about, p.experience, p.education, p.skills, p.languages,
    p.certifications, p.url, p.picture, p.connections, p.profileAge,
  ].map(escapeCSV);
}

export function exportCSV(profiles) {
  const rows = [HEADERS.join(','), ...profiles.map(p => profileToRow(p).join(','))];
  const csv = rows.join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const date = new Date().toISOString().slice(0, 10);
  download(blob, `linkedin_profiles_${date}.csv`);
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
