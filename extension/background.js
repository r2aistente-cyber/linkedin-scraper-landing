// background.js — service worker: maneja batch extraction

const MIN_DELAY = 1500;
const MAX_DELAY = 3000;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomDelay() {
  return MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
}

function waitForTabReady(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Tab load timeout'));
    }, 30000);

    function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(timeout);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function sendMessageWithRetry(tabId, msg, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, msg);
      return response;
    } catch (e) {
      if (i < retries - 1) await sleep(800);
    }
  }
  throw new Error('Content script not responding');
}

async function extractBatch(urls, senderId) {
  const results = [];
  const total = urls.length;

  await chrome.storage.local.set({
    batchResults: [],
    batchProgress: { done: 0, total, running: true, errors: [] },
  });

  function notifyProgress(done, error) {
    const progress = { done, total, running: done < total, errors: error ? [error] : [] };
    chrome.storage.local.set({ batchProgress: progress, batchResults: results });
    // Intentar notificar al popup si sigue abierto
    chrome.runtime.sendMessage({ action: 'batchProgress', done, total, results }).catch(() => {});
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i].trim();
    if (!url) continue;

    let tab;
    try {
      tab = await chrome.tabs.create({ url });
      await waitForTabReady(tab.id);
      // Dar tiempo al content script para inicializarse
      await sleep(600);

      const response = await sendMessageWithRetry(tab.id, { action: 'extract' });
      const data = response?.data;

      if (Array.isArray(data)) {
        results.push(...data.map(p => ({ ...p, _source: url })));
      } else if (data && typeof data === 'object') {
        results.push({ ...data, _source: url });
      }
    } catch (e) {
      results.push({ url, error: e.message, _source: url });
      notifyProgress(i + 1, `Error en ${url}: ${e.message}`);
    } finally {
      if (tab?.id) chrome.tabs.remove(tab.id).catch(() => {});
    }

    notifyProgress(i + 1);
    if (i < urls.length - 1) await sleep(randomDelay());
  }

  await chrome.storage.local.set({
    batchResults: results,
    batchProgress: { done: total, total, running: false, errors: [] },
  });

  chrome.runtime.sendMessage({ action: 'batchDone', results }).catch(() => {});
  return results;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'startBatch') {
    extractBatch(msg.urls, sender.tab?.id)
      .then(() => sendResponse({ ok: true }))
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true; // async
  }

  if (msg.action === 'getStorage') {
    chrome.storage.local.get(['batchResults', 'batchProgress', 'extractedProfiles'], data => {
      sendResponse(data);
    });
    return true;
  }

  if (msg.action === 'saveProfiles') {
    chrome.storage.local.get(['extractedProfiles'], ({ extractedProfiles }) => {
      const existing = extractedProfiles || [];
      const merged = [...existing, ...msg.profiles];
      chrome.storage.local.set({ extractedProfiles: merged }, () => {
        sendResponse({ total: merged.length });
      });
    });
    return true;
  }

  if (msg.action === 'clearProfiles') {
    chrome.storage.local.set({ extractedProfiles: [], batchResults: [], batchProgress: null }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
