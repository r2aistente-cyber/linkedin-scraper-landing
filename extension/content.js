// content.js — inyectado en linkedin.com, extrae datos del DOM

function extractSearchResults() {
  const cards = document.querySelectorAll('.entity-result');
  if (!cards.length) {
    // Fallback selector para variantes de LinkedIn
    const alt = document.querySelectorAll('[data-view-name="search-entity-result-universal-template"]');
    return extractFromCards(alt.length ? alt : cards);
  }
  return extractFromCards(cards);
}

function extractFromCards(cards) {
  return Array.from(cards).map(card => {
    const titleEl = card.querySelector('.entity-result__title-text a');
    const headlineEl = card.querySelector('.entity-result__summary--2-lines') ||
                       card.querySelector('.entity-result__summary');
    const subtitleEl = card.querySelector('.entity-result__subtitle');
    const locationEl = card.querySelector('.entity-result__secondary-subtitle') ||
                       card.querySelector('.entity-result__metadata-item');
    const imgEl = card.querySelector('img');

    return {
      name:      titleEl?.innerText?.trim() || '',
      headline:  headlineEl?.innerText?.trim() || '',
      company:   subtitleEl?.innerText?.trim() || '',
      location:  locationEl?.innerText?.trim() || '',
      url:       titleEl?.href || '',
      picture:   imgEl?.src || '',
    };
  }).filter(p => p.name);
}

function extractCurrentCompany() {
  const expSection = document.getElementById('experience');
  if (!expSection) return '';
  const firstItem = expSection.closest('section')?.querySelector('.pvs-list__item--line-separated');
  if (!firstItem) return '';
  const spans = firstItem.querySelectorAll('span[aria-hidden="true"]');
  return spans[1]?.innerText?.trim() || '';
}

function extractCurrentPosition() {
  const expSection = document.getElementById('experience');
  if (!expSection) return '';
  const firstItem = expSection.closest('section')?.querySelector('.pvs-list__item--line-separated');
  if (!firstItem) return '';
  const spans = firstItem.querySelectorAll('span[aria-hidden="true"]');
  return spans[0]?.innerText?.trim() || '';
}

function extractSection(id) {
  const anchor = document.getElementById(id);
  if (!anchor) return '';
  const section = anchor.closest('section');
  if (!section) return '';
  const items = section.querySelectorAll('.pvs-list__item--line-separated span[aria-hidden="true"]');
  return Array.from(items)
    .map(el => el.innerText.trim())
    .filter(Boolean)
    .join(' | ');
}

function extractLanguages() {
  return extractSection('languages');
}

function extractConnections() {
  const el = document.querySelector('.pvs-header__subtitle span');
  return el?.innerText?.trim() || '';
}

function extractProfile() {
  const h1 = document.querySelector('h1');
  const headlineEl = document.querySelector('.text-body-medium.break-words') ||
                     document.querySelector('.text-body-medium');
  const locationEl = document.querySelector('.text-body-small.inline.t-black--light.break-words') ||
                     document.querySelector('.pv-text-details__left-panel .text-body-small');
  const aboutEl = document.querySelector('#about')?.closest('section')
                    ?.querySelector('.inline-show-more-text span[aria-hidden="true"]') ||
                  document.querySelector('#about ~ div .inline-show-more-text');
  const picEl = document.querySelector('img.evi-image.ember-view.profile-photo-edit__preview') ||
                document.querySelector('.pv-top-card-profile-picture__image') ||
                document.querySelector('img.profile-photo-edit__preview');

  return {
    name:           h1?.innerText?.trim() || '',
    headline:       headlineEl?.innerText?.trim() || '',
    company:        extractCurrentCompany(),
    position:       extractCurrentPosition(),
    location:       locationEl?.innerText?.trim() || '',
    about:          aboutEl?.innerText?.trim() || '',
    experience:     extractSection('experience'),
    education:      extractSection('education'),
    skills:         extractSection('skills'),
    languages:      extractLanguages(),
    certifications: extractSection('certifications'),
    url:            window.location.href,
    picture:        picEl?.src || '',
    connections:    extractConnections(),
    profileAge:     '',
  };
}

function countSearchResults() {
  const cards = document.querySelectorAll('.entity-result');
  return cards.length;
}

function isSearchPage() {
  return window.location.href.includes('/search/results/');
}

function isProfilePage() {
  return /linkedin\.com\/in\//.test(window.location.href);
}

async function autoScroll() {
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
      return true; // async
    } else {
      sendResponse({ type: 'none', data: [] });
    }
    return;
  }
});
