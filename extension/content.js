// content.js — inyectado en linkedin.com, extrae datos del DOM
// Selectores tolerantes para múltiples versiones del layout de LinkedIn

/* ─── HELPER: obtiene texto de un elemento con fallbacks ─── */
function getText(el, ...selectors) {
  for (const sel of selectors) {
    const found = typeof sel === 'string' ? el.querySelector(sel) : sel;
    if (found?.innerText?.trim()) return found.innerText.trim();
  }
  return '';
}

function getHref(el, ...selectors) {
  for (const sel of selectors) {
    const found = typeof sel === 'string' ? el.querySelector(sel) : sel;
    if (found?.href) return found.href;
  }
  return '';
}

function getSrc(el, ...selectors) {
  for (const sel of selectors) {
    const found = typeof sel === 'string' ? el.querySelector(sel) : sel;
    if (found?.src) return found.src;
  }
  return '';
}

/* ─── EXTRAER RESULTADOS DE BÚSQUEDA ─── */
function extractSearchResults() {
  // Intentar múltiples selectores para tarjetas de perfil
  const cardSelectors = [
    '.entity-result',
    '[data-view-name="search-entity-result-universal-template"]',
    '.search-entity-result',
    'li[data-urn*="urn:li:member"]',
    '.reusable-search__entity-result',
    'article[data-view-name="search-entity-result"]',
    'li.reusable-search__result-section > ul > li',
  ];

  let cards = [];
  for (const sel of cardSelectors) {
    cards = document.querySelectorAll(sel);
    if (cards.length > 0) break;
  }

  // Fallback extremo: buscar cualquier enlace que contenga /in/ en href
  if (cards.length === 0) {
    const links = document.querySelectorAll('a[href*="/in/"]');
    const parentCandidates = new Set();
    links.forEach(a => {
      let p = a.parentElement;
      let depth = 0;
      while (p && depth < 5) {
        if (p.children.length > 2 && p.children.length < 20) {
          parentCandidates.add(p);
          break;
        }
        p = p.parentElement;
        depth++;
      }
    });
    cards = Array.from(parentCandidates).slice(0, 20);
  }

  return extractFromCards(cards);
}

function extractFromCards(cards) {
  return Array.from(cards).map(card => {
    // Name: buscar enlaces que contengan /in/
    const nameLink = card.querySelector('a[href*="/in/"]');
    const name = nameLink
      ? (nameLink.innerText?.trim() || nameLink.querySelector('span')?.innerText?.trim() || '')
      : getText(card,
          '.entity-result__title-text a',
          '.actor-name',
          'span[aria-hidden="true"]',
          '.title'
        );

    // Headline: texto debajo del nombre
    const headline = getText(card,
      '.entity-result__summary',
      '.entity-result__summary--2-lines',
      '.subline',
      '.subtitle',
      '.entity-result__title-text + *'
    );

    // Company / subtitle
    const company = getText(card,
      '.entity-result__subtitle',
      '.entity-result__primary-subtitle',
      '.secondary-subtitle'
    );

    // Location
    const location = getText(card,
      '.entity-result__secondary-subtitle',
      '.entity-result__metadata-item',
      '.metadata',
      '.entity-result__metadata'
    );

    // Profile picture
    const img = card.querySelector('img');
    const picture = img?.src?.startsWith('data:') ? '' : (img?.src || '');

    // URL from the name link
    const url = nameLink?.href || '';

    return {
      name: name || '',
      headline: headline || '',
      company: company || '',
      location: location || '',
      url: url || '',
      picture: picture || '',
    };
  }).filter(p => p.name);
}

/* ─── EXTRAER PERFIL INDIVIDUAL ─── */
function extractCurrentCompany() {
  // Buscar en la sección de experiencia
  const expSection = document.getElementById('experience');
  if (!expSection) return '';

  // Buscar spans no vacíos con aria-hidden dentro del primer item
  const section = expSection.closest('section') || expSection.parentElement;
  const items = section.querySelectorAll('[aria-hidden="true"]');
  const texts = Array.from(items).map(el => el.innerText?.trim()).filter(Boolean);

  // El segundo texto suele ser la empresa
  return texts.length > 1 ? texts[1] : (texts[0] || '');
}

function extractCurrentPosition() {
  const expSection = document.getElementById('experience');
  if (!expSection) return '';
  const section = expSection.closest('section') || expSection.parentElement;
  const items = section.querySelectorAll('[aria-hidden="true"]');
  const texts = Array.from(items).map(el => el.innerText?.trim()).filter(Boolean);
  return texts[0] || '';
}

function extractSectionText(id) {
  const anchor = document.getElementById(id);
  if (!anchor) return '';
  const section = anchor.closest('section') || anchor.parentElement;
  if (!section) return '';
  const items = section.querySelectorAll('[aria-hidden="true"]');
  return Array.from(items)
    .map(el => el.innerText?.trim())
    .filter(Boolean)
    .join(' | ');
}

function extractProfile() {
  // Name: h1 es estable en LinkedIn
  const h1 = document.querySelector('h1');
  const name = h1?.innerText?.trim() || '';

  // Headline
  const headlineEl = document.querySelector('.text-body-medium') ||
                     document.querySelector('[class*="text-body-medium"]');
  const headline = headlineEl?.innerText?.trim() || '';

  // Location
  const locationEl = document.querySelector('.text-body-small') ||
                     document.querySelector('[class*="text-body-small"]');
  const location = locationEl?.innerText?.trim() || '';

  // About
  const aboutSection = document.getElementById('about');
  let about = '';
  if (aboutSection) {
    const aboutText = aboutSection.closest('section')?.querySelector('[aria-hidden="true"]');
    if (aboutText) about = aboutText.innerText.trim();
  }

  // Profile picture
  const picEl = document.querySelector('img[class*="profile-photo"]') ||
                document.querySelector('img[class*="evi-image"]') ||
                document.querySelector('.pv-top-card-profile-picture__image') ||
                document.querySelector('img[src*="profile"]');
  const picture = picEl?.src || '';

  return {
    name:           name || '',
    headline:       headline || '',
    company:        extractCurrentCompany() || '',
    position:       extractCurrentPosition() || '',
    location:       location || '',
    about:          about || '',
    experience:     extractSectionText('experience') || '',
    education:      extractSectionText('education') || '',
    skills:         extractSectionText('skills') || '',
    languages:      extractSectionText('languages') || '',
    certifications: extractSectionText('certifications') || '',
    url:            window.location.href || '',
    picture:        picture || '',
    connections:    '',
    profileAge:     '',
  };
}

/* ─── DETECCIÓN DE PÁGINA ─── */
function isSearchPage() {
  return window.location.href.includes('/search/results/') ||
         window.location.href.includes('/search/');
}

function isProfilePage() {
  return /linkedin\.com\/in\//.test(window.location.href);
}

function countSearchResults() {
  const cards = extractSearchResults();
  return cards.length;
}

/* ─── AUTO-SCROLL ─── */
function autoScroll() {
  return new Promise(resolve => {
    let lastHeight = document.body.scrollHeight;
    let attempts = 0;
    const max = 5;
    const step = () => {
      window.scrollTo(0, document.body.scrollHeight);
      setTimeout(() => {
        const newHeight = document.body.scrollHeight;
        if (newHeight === lastHeight || ++attempts >= max) return resolve();
        lastHeight = newHeight;
        step();
      }, 1500);
    };
    step();
  });
}

/* ─── LISTENER ─── */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'ping') {
    sendResponse({ ok: true });
    return;
  }

  if (msg.action === 'count') {
    sendResponse({
      count: countSearchResults(),
      isSearch: isSearchPage(),
      isProfile: isProfilePage(),
    });
    return;
  }

  if (msg.action === 'extract') {
    if (isProfilePage()) {
      sendResponse({ type: 'profile', data: extractProfile() });
    } else if (isSearchPage()) {
      (async () => {
        if (msg.scroll) await autoScroll();
        sendResponse({ type: 'search', data: extractSearchResults() });
      })();
      return true;
    } else {
      sendResponse({ type: 'none', data: [] });
    }
    return;
  }
});
