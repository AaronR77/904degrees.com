/* 904° MARK12 — Streamlined Showroom collection and inquiry email.
 * The browser preview is intentionally not a site editor: nothing here grants
 * database roles, saves another customer's data, or modifies a live demo.
 */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  // Catalog: one shared collection for all invitees, never per-customer filtering.
  const storageKey = '904_showroom_favorites_v1';
  let favorites = [];
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) favorites = stored.filter(id => typeof id === 'string');
  } catch (_) { /* Storage optional */ }
  function storeFavorites() { try { sessionStorage.setItem(storageKey, JSON.stringify(favorites)); } catch (_) { /* Optional */ } }
  const search = $('#design-search');
  const category = $('#design-category');
  const sort = $('#design-sort');
  const grid = $('#design-grid');
  const countNode = $('#design-count');
  const summary = $('#favorite-summary');
  let designs = [];
  let orderingReady = false;

  function updateSummary() {
    const saved = designs.filter(design => favorites.includes(design.id));
    summary.textContent = saved.length
      ? saved.map(design => design.name).join(' · ')
      : 'No designs saved yet.';
  }
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function makeThumbnail() {
    const outer = element('div', 'design-thumbnail');
    const windowNode = element('div', 'thumb-window');
    const bar = element('div', 'thumb-bar');
    for (let i = 0; i < 3; i++) bar.append(element('i'));
    const mockHero = element('div', 'thumb-hero'); mockHero.append(element('span'));
    const tiles = element('div', 'thumb-tiles');
    for (let i = 0; i < 3; i++) tiles.append(element('i'));
    windowNode.append(bar, mockHero, tiles);
    outer.append(windowNode);
    return outer;
  }
  function makeCard(design) {
    const article = element('article', 'design-card');
    const thumb = makeThumbnail();
    thumb.append(element('span', 'design-thumb-id', design.id.toUpperCase().replace(/-/g, ' ')));
    const body = element('div', 'design-card-body');
    body.append(element('div', 'design-id', design.category.toUpperCase() + ' / DESIGN ' + String(design.number).padStart(3, '0')));
    body.append(element('h3', '', design.name));
    body.append(element('p', '', design.subtitle + ' — ' + design.description));
    const buttons = element('div', 'design-card-actions');
    const details = element('a', 'button button-primary', 'EXPLORE DESIGN ↗');
    details.href = design.detailPath;
    const demo = element('a', 'button button-outline', 'LIVE DEMO ↗');
    demo.href = design.demoPath;
    demo.target = '_blank'; demo.rel = 'noopener';
    const fav = element('button', 'fav-button'); fav.type = 'button';
    const updateFavorite = () => {
      const pressed = favorites.includes(design.id);
      fav.textContent = pressed ? '★' : '☆';
      fav.setAttribute('aria-pressed', String(pressed));
      fav.setAttribute('aria-label', pressed ? 'Remove ' + design.name + ' from shortlist' : 'Save ' + design.name + ' to shortlist');
      fav.title = pressed ? 'Remove from shortlist' : 'Save design';
    };
    fav.addEventListener('click', () => {
      favorites = favorites.includes(design.id) ? favorites.filter(id => id !== design.id) : [...favorites, design.id];
      storeFavorites(); updateFavorite(); updateSummary();
    });
    updateFavorite(); buttons.append(details, demo, fav); body.append(buttons);
    article.append(thumb, body);
    return article;
  }
  function renderCatalog() {
    const term = search.value.trim().toLocaleLowerCase();
    const selectedCategory = category.value;
    const match = design => (!selectedCategory || design.category === selectedCategory) &&
      [design.id, design.name, design.subtitle, design.category, design.description, design.exampleBusiness || '', ...design.tags]
        .join(' ').toLocaleLowerCase().includes(term);
    const found = designs.filter(match);
    switch (sort.value) {
      case 'newest': found.sort((a, b) => b.updated.localeCompare(a.updated) || a.number - b.number); break;
      case 'number': found.sort((a, b) => a.number - b.number); break;
      case 'name': found.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: found.sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order || a.number - b.number);
    }
    countNode.textContent = found.length + ' DESIGN' + (found.length === 1 ? '' : 'S') + ' AVAILABLE';
    grid.replaceChildren();
    if (!found.length) grid.append(element('div', 'empty-state', 'No designs found. Try another search.'));
    else found.forEach(d => grid.append(makeCard(d)));
    updateSummary();
  }
  search.addEventListener('input', renderCatalog);
  category.addEventListener('change', renderCatalog);
  sort.addEventListener('change', renderCatalog);
  async function loadCatalog() {
    try {
      const response = await fetch('/showroom/catalog/designs.json', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Unable to load the published design catalog.');
      const data = await response.json();
      if (!Array.isArray(data.designs)) throw new Error('Invalid design catalog format.');
      designs = data.designs.filter(item => item && item.published === true &&
        Number.isInteger(item.number) && typeof item.id === 'string' && typeof item.name === 'string' &&
        typeof item.description === 'string' && typeof item.category === 'string' &&
        Array.isArray(item.tags) && typeof item.updated === 'string' &&
        Number.isFinite(item.order) &&
        typeof item.demoPath === 'string' && item.demoPath.startsWith('/showroom/') &&
        typeof item.detailPath === 'string' && item.detailPath.startsWith('/showroom/'));
      for (const name of [...new Set(designs.map(design => design.category))].sort()) {
        const option = document.createElement('option'); option.value = name; option.textContent = name; category.append(option);
      }
      const choice = $('#inquiry-design');
      for (const item of designs) {
        const option = document.createElement('option'); option.value = item.id; option.textContent = item.name; choice.append(option);
      }
      renderCatalog();
    } catch (_) {
      countNode.textContent = 'CATALOG UNAVAILABLE';
      grid.replaceChildren(element('div', 'empty-state', 'The catalog could not load. Try refreshing the page.'));
    }
  }
  loadCatalog();

  async function readAccount() {
    const status = $('#order-account-info');
    try {
      const response = await fetch('/api/showroom/me', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Account not yet enabled.');
      const data = await response.json();
      if (!data.ok || !data.account) throw new Error('Account unavailable.');
      orderingReady = true;
      $('#inquiry-submit').disabled = false;
      status.textContent = 'Signed in: ' + data.account.email + ' · ' +
        (data.account.roles.customer ? 'Customer' : data.account.roles.prospect ? 'Prospect' : 'Administrator');
    } catch (_) {
      status.textContent = 'Account ordering is not yet enabled here. Contact aaron@904degrees.com to place an order until activation is complete.';
      $('#inquiry-submit').disabled = true;
    }
  }
  readAccount();
  $('#inquiry-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!orderingReady) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const button = $('#inquiry-submit'), line = $('#inquiry-status');
    button.disabled = true;
    line.textContent = 'Submitting your order securely…';
    try {
      const response = await fetch('/api/showroom/orders', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type':'application/json', Accept:'application/json' },
        body: JSON.stringify(values)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Unable to submit.');
      line.textContent = 'Order ' + result.order.reference + ' received. We will review your requirements and follow up with a proposal before invoicing.';
      form.reset();
    } catch (error) { line.textContent = 'Order not submitted: ' + error.message; }
    finally { button.disabled = !orderingReady; }
  });
})();
