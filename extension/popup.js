// popup.js — lógica del popup

import { exportCSV } from './lib/csv.js';
import { exportXLSX } from './lib/xlsx.js';
import { exportJSON } from './lib/json.js';

// ─── estado local ─────────────────────────────────────────────────────────────

let currentTab = null;
let allProfiles = [];
let batchRunning = false;

// ─── init ─────────────────────────────────────────────────────────────────────

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  loadStoredProfiles();
  detectPage(tab);
  bindEvents();
  listenBatchProgress();
}

async function loadStoredProfiles() {
  const { extractedProfiles } = await chrome.storage.local.get('extractedProfiles');
  allProfiles = extractedProfiles || [];
  refreshExportUI();
}

async function detectPage(tab) {
  const statusEl = document.getElementById('page-status');
  const extractSection = document.getElementById('extract-section');
  const notLinkedin = document.getElementById('page-not-linkedin');

  const isLinkedin = tab.url?.includes('linkedin.com');
  if (!isLinkedin) {
    statusEl.className = 'status-line muted';
    statusEl.textContent = 'Not a LinkedIn page';
    notLinkedin.classList.remove('hidden');
    return;
  }

  try {
    const res = await chrome.tabs.sendMessage(tab.id, { action: 'count' });
    if (res.isProfile) {
      statusEl.className = 'status-line success';
      statusEl.textContent = '👤 Individual profile detected';
      extractSection.classList.remove('hidden');
      document.getElementById('btn-extract').textContent = '📥 Extract this profile';
    } else if (res.isSearch) {
      const n = res.count;
      statusEl.className = n > 0 ? 'status-line success' : 'status-line muted';
      statusEl.textContent = n > 0
        ? `📊 ${n} profile${n !== 1 ? 's' : ''} detected on this page`
        : 'Search page — 0 profiles detected yet (try scrolling)';
      extractSection.classList.remove('hidden');
      document.getElementById('btn-extract').textContent = `📥 Extract all (${n})`;
    } else {
      statusEl.className = 'status-line muted';
      statusEl.textContent = 'LinkedIn page — no profiles detected here';
    }
  } catch {
    statusEl.className = 'status-line warn';
    statusEl.textContent = 'Could not read page (try refreshing)';
  }
}

// ─── extracción de página actual ──────────────────────────────────────────────

async function extractCurrentPage() {
  const btn = document.getElementById('btn-extract');
  const scroll = document.getElementById('opt-scroll').checked;
  btn.disabled = true;
  btn.textContent = '⏳ Extracting...';

  try {
    const res = await chrome.tabs.sendMessage(currentTab.id, { action: 'extract', scroll });
    const profiles = Array.isArray(res.data) ? res.data : [res.data];
    const valid = profiles.filter(p => p && (p.name || p.url));

    await saveProfiles(valid);
    btn.textContent = `✅ ${valid.length} extracted`;
    setTimeout(() => detectPage(currentTab), 1200);
  } catch (e) {
    btn.textContent = '❌ Error — try refreshing';
    console.error(e);
  } finally {
    btn.disabled = false;
  }
}

// ─── batch ────────────────────────────────────────────────────────────────────

async function startBatch() {
  if (batchRunning) return;
  const textarea = document.getElementById('batch-urls');
  const raw = textarea.value.trim();
  if (!raw) return;

  const urls = raw.split('\n').map(u => u.trim()).filter(u => u.includes('linkedin.com'));
  if (!urls.length) {
    alert('No valid LinkedIn URLs found.');
    return;
  }

  batchRunning = true;
  document.getElementById('btn-batch').disabled = true;
  document.getElementById('batch-progress-wrap').classList.remove('hidden');
  updateBatchUI(0, urls.length, []);

  await chrome.storage.local.set({ batchResults: [], batchProgress: null });
  chrome.runtime.sendMessage({ action: 'startBatch', urls });
}

function updateBatchUI(done, total, results) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('batch-bar').style.width = pct + '%';
  document.getElementById('batch-label').textContent = `${done} / ${total} (${pct}%)`;

  const container = document.getElementById('batch-items');
  container.innerHTML = '';
  results.slice(-5).forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'batch-item';
    div.innerHTML = r.error
      ? `<span>❌</span><span style="color:#b24020">${r._source || r.url}</span>`
      : `<span>✅</span><span>${r.name || r._source || '—'}</span>`;
    container.appendChild(div);
  });
}

function listenBatchProgress() {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'batchProgress') {
      updateBatchUI(msg.done, msg.total, msg.results || []);
    }
    if (msg.action === 'batchDone') {
      batchRunning = false;
      document.getElementById('btn-batch').disabled = false;
      updateBatchUI(msg.results.length, msg.results.length, msg.results);
      saveProfiles(msg.results);
      document.getElementById('batch-label').textContent =
        `✅ Done — ${msg.results.length} profiles extracted`;
    }
  });
}

// ─── storage ──────────────────────────────────────────────────────────────────

async function saveProfiles(newProfiles) {
  if (!newProfiles.length) return;
  const res = await chrome.runtime.sendMessage({ action: 'saveProfiles', profiles: newProfiles });
  const { extractedProfiles } = await chrome.storage.local.get('extractedProfiles');
  allProfiles = extractedProfiles || [];
  refreshExportUI();
}

function refreshExportUI() {
  const lastEl = document.getElementById('last-extraction');
  const badge = document.getElementById('total-badge');
  const n = allProfiles.length;

  badge.textContent = `${n} profile${n !== 1 ? 's' : ''}`;

  if (n === 0) {
    lastEl.className = 'status-line muted';
    lastEl.textContent = 'No data yet';
  } else {
    lastEl.className = 'status-line success';
    const now = new Date();
    lastEl.textContent = `${n} profiles · ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}

// ─── exportar ─────────────────────────────────────────────────────────────────

function getProfilesToExport() {
  if (!allProfiles.length) {
    alert('No profiles extracted yet.');
    return null;
  }
  return allProfiles;
}

// ─── events ───────────────────────────────────────────────────────────────────

function bindEvents() {
  document.getElementById('btn-extract').addEventListener('click', extractCurrentPage);
  document.getElementById('btn-batch').addEventListener('click', startBatch);

  document.getElementById('btn-csv').addEventListener('click', () => {
    const data = getProfilesToExport();
    if (data) exportCSV(data);
  });
  document.getElementById('btn-excel').addEventListener('click', () => {
    const data = getProfilesToExport();
    if (data) exportXLSX(data);
  });
  document.getElementById('btn-json').addEventListener('click', () => {
    const data = getProfilesToExport();
    if (data) exportJSON(data);
  });

  document.getElementById('btn-clear').addEventListener('click', async () => {
    if (!confirm('Clear all extracted profiles?')) return;
    await chrome.runtime.sendMessage({ action: 'clearProfiles' });
    allProfiles = [];
    refreshExportUI();
    document.getElementById('batch-progress-wrap').classList.add('hidden');
  });
}

// ─── start ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
