// lib/xlsx.js — exportar a Excel como HTML table (compatible con Excel/Sheets)

const HEADERS = [
  'Name', 'Headline', 'Company', 'Position', 'Location',
  'About', 'Experience', 'Education', 'Skills', 'Languages',
  'Certifications', 'URL', 'Picture', 'Connections', 'ProfileAge',
];

function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function profileToRow(p) {
  return [
    p.name, p.headline, p.company, p.position, p.location,
    p.about, p.experience, p.education, p.skills, p.languages,
    p.certifications, p.url, p.picture, p.connections, p.profileAge,
  ];
}

export function exportXLSX(profiles) {
  const headerRow = HEADERS.map(h => `<th style="background:#0a66c2;color:#fff;padding:6px 10px;font-weight:bold">${h}</th>`).join('');
  const dataRows = profiles.map((p, i) => {
    const bg = i % 2 === 0 ? '#ffffff' : '#f0f7ff';
    const cells = profileToRow(p).map(v => `<td style="padding:5px 10px;border:1px solid #ddd;background:${bg}">${esc(v)}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>LinkedIn Profiles</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
<body>
<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px">
  <thead><tr>${headerRow}</tr></thead>
  <tbody>${dataRows}</tbody>
</table>
</body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `linkedin_profiles_${date}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}
