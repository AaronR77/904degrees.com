(() => {
  const $ = selector => document.querySelector(selector);
  const page = document.body.dataset.page || 'home';
  const parentCategory = document.body.dataset.category || '';
  const searchForm = $('.search-form');
  const searchInput = $('#siteSearch');
  const grid = $('#productGrid');
  const pageSize = 12;
  const state = { products: [], visible: pageSize, min: null, max: null, brand: '', size: '', categories: new Set(), query: '', sort: 'featured' };
  const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((Number(cents) || 0) / 100);
  const readParams = () => new URLSearchParams(location.search);
  const productPrice = p => Number(p.salePriceCents ?? p.priceCents ?? 0);
  const toCents = dollars => { if (dollars === '' || dollars == null) return null; const n = Number(dollars); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null; };

  function setUrl() {
    const params = readParams();
    for (const key of ['q', 'min', 'max', 'brand', 'size', 'sort', 'subcat']) params.delete(key);
    if (state.query) params.set('q', state.query);
    if (state.min !== null) params.set('min', (state.min / 100).toFixed(2));
    if (state.max !== null) params.set('max', (state.max / 100).toFixed(2));
    if (state.brand) params.set('brand', state.brand);
    if (state.size) params.set('size', state.size);
    if (state.sort !== 'featured') params.set('sort', state.sort);
    for (const category of state.categories) params.append('subcat', category);
    const query = params.toString();
    history.replaceState({}, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  }
  function loadStateFromUrl() {
    const p = readParams();
    state.query = p.get('q') || '';
    state.min = toCents(p.get('min'));
    state.max = toCents(p.get('max'));
    state.brand = p.get('brand') || '';
    state.size = p.get('size') || '';
    state.categories = new Set(p.getAll('subcat'));
    state.sort = ['featured', 'price-asc', 'price-desc', 'name-asc'].includes(p.get('sort')) ? p.get('sort') : 'featured';
    if (searchInput) searchInput.value = state.query;
    if ($('#minPrice')) $('#minPrice').value = state.min === null ? '' : (state.min / 100).toFixed(2);
    if ($('#maxPrice')) $('#maxPrice').value = state.max === null ? '' : (state.max / 100).toFixed(2);
    if ($('#sortSelect')) $('#sortSelect').value = state.sort;
  }
  function currentProducts() {
    const term = state.query.trim().toLocaleLowerCase();
    let items = state.products.filter(p => !parentCategory || term || String(p.category || '').toLocaleLowerCase() === parentCategory.toLocaleLowerCase());
    if (term) items = items.filter(p => `${p.name || ''} ${p.brand || ''} ${p.category || ''} ${p.description || ''} ${p.size || ''} ${p.subcategory || ''}`.toLocaleLowerCase().includes(term));
    if (state.min !== null) items = items.filter(p => productPrice(p) >= state.min);
    if (state.max !== null) items = items.filter(p => productPrice(p) <= state.max);
    if (state.brand) items = items.filter(p => p.brand === state.brand);
    if (state.size) items = items.filter(p => p.size === state.size);
    if (state.categories.size) items = items.filter(p => state.categories.has(p.subcategory || p.category));
    if (state.sort === 'price-asc') items.sort((a, b) => productPrice(a) - productPrice(b));
    else if (state.sort === 'price-desc') items.sort((a, b) => productPrice(b) - productPrice(a));
    else if (state.sort === 'name-asc') items.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    else items.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    return items;
  }
  function cardFor(product, index) {
    const article = document.createElement('article'); article.className = 'product-card';
    const art = document.createElement('div'); art.className = 'product-image';
    art.style.setProperty('--art-bg', ['#e9e6dc', '#e2e6df', '#eee5da', '#e8e5d7'][index % 4]);
    const department = String(product.category || '').toLowerCase();
    const imagePath = product.imageUrl || product.image || (product.imageKey ? `/demo/liquorstore/images/catalog/${department}/${product.imageKey}` : '');
    if (imagePath) {
      const img = document.createElement('img'); img.src = imagePath; img.alt = product.imageAlt || `${product.name} bottle`; img.loading = 'lazy'; art.append(img);
    } else {
      const bottle = document.createElement('span'); bottle.className = 'bottle-placeholder'; bottle.setAttribute('aria-hidden', 'true'); bottle.style.filter = `hue-rotate(${(index * 29) % 100}deg)`; art.append(bottle);
    }
    const tag = document.createElement('span'); tag.className = 'product-tag'; tag.textContent = product.available ? (product.subcategory || product.category || 'Shop favorite') : 'Ask about availability'; art.append(tag);
    const info = document.createElement('div'); info.className = 'product-info';
    const category = document.createElement('p'); category.className = 'product-category'; category.textContent = product.subcategory || product.category || '';
    const name = document.createElement('h3'); name.textContent = product.name || 'Untitled item';
    const meta = document.createElement('p'); meta.className = 'product-meta'; meta.textContent = [product.brand, product.size].filter(Boolean).join(' · ') || 'Ask us for details';
    const description = document.createElement('p'); description.className = 'product-description'; description.textContent = product.description || '';
    const bottom = document.createElement('div'); bottom.className = 'product-bottom';
    const price = document.createElement('span'); price.className = 'product-price'; price.textContent = money(productPrice(product));
    const availability = document.createElement('span'); availability.className = 'product-availability'; availability.textContent = product.available ? 'In-store selection' : 'Currently unavailable';
    bottom.append(price, availability); info.append(category, name, meta, description, bottom); article.append(art, info); return article;
  }
  function fillFacet(root, values, key, selected) {
    const el = $(root); if (!el) return;
    const list = [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    el.replaceChildren();
    if (!list.length) { const text = document.createElement('span'); text.className = 'facet-empty'; text.textContent = 'No options yet'; el.append(text); return; }
    for (const value of list) {
      const label = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox'; input.value = value; input.checked = selected === value || state.categories.has(value); input.dataset.facet = key;
      const text = document.createElement('span'); text.textContent = value; label.append(input, text); el.append(label);
    }
  }
  function drawFacets() {
    const items = state.products.filter(p => !parentCategory || state.query || String(p.category || '').toLocaleLowerCase() === parentCategory.toLocaleLowerCase());
    const subcategories = items.map(p => p.subcategory).filter(Boolean);
    fillFacet('#facetCategories', subcategories.length ? subcategories : items.map(p => p.category), 'category', '');
    fillFacet('#facetBrands', items.map(p => p.brand), 'brand', state.brand);
    fillFacet('#facetSizes', items.map(p => p.size), 'size', state.size);
    const singleCategory = [...new Set(items.map(p => p.category).filter(Boolean))];
    if (singleCategory.length <= 1 && !subcategories.length && parentCategory) {
      const group = $('#facetCategories')?.closest('.filter-group'); if (group) group.hidden = true;
    }
  }
  function updateChips() {
    const root = $('#activeFilters'); if (!root) return; root.replaceChildren();
    const chips = [];
    if (state.query) chips.push(['Search: ' + state.query, () => { state.query = ''; if (searchInput) searchInput.value = ''; }]);
    if (state.min !== null || state.max !== null) chips.push([`${state.min === null ? 'Any' : money(state.min)} – ${state.max === null ? 'Any' : money(state.max)}`, () => { state.min = state.max = null; $('#minPrice').value = ''; $('#maxPrice').value = ''; }]);
    if (state.brand) chips.push([state.brand, () => { state.brand = ''; }]);
    if (state.size) chips.push([state.size, () => { state.size = ''; }]);
    for (const selected of state.categories) chips.push([selected, () => state.categories.delete(selected)]);
    for (const [text, clear] of chips) { const chip = document.createElement('span'); chip.className = 'filter-chip'; chip.append(document.createTextNode(text)); const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `Remove ${text} filter`); button.textContent = '×'; button.addEventListener('click', () => { clear(); state.visible = pageSize; setUrl(); drawFacets(); render(); }); chip.append(button); root.append(chip); }
    const badge = $('#filterBadge'); if (badge) { badge.textContent = String(chips.length); badge.hidden = chips.length === 0; }
  }
  function render() {
    if (!grid) return;
    const matches = currentProducts(); state.visible = Math.max(pageSize, state.visible);
    const count = $('#resultCount'); if (count) count.textContent = `${matches.length} ${matches.length === 1 ? 'item' : 'items'}`;
    const title = $('#listingTitle'); if (title) title.textContent = state.query ? `Results for “${state.query}”` : (page === 'home' ? 'From our shelves' : `All ${parentCategory}`);
    if (page === 'category') { const intro = $('.category-intro'); if (intro) intro.hidden = Boolean(state.query); const crumb = $('.breadcrumbs span:last-child'); if (crumb) crumb.textContent = state.query ? 'Search results' : parentCategory; }
    grid.replaceChildren();
    const visible = matches.slice(0, state.visible);
    if (!visible.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'No items match those filters. Try changing your search or clearing a filter.'; grid.append(empty); }
    else visible.forEach((product, i) => grid.append(cardFor(product, i)));
    const more = $('#loadMore'); if (more) more.hidden = matches.length <= state.visible;
    updateChips();
  }
  function applyPrice(min, max) {
    const minValue = min === undefined ? toCents($('#minPrice')?.value) : toCents(String(min));
    const maxValue = max === undefined ? toCents($('#maxPrice')?.value) : toCents(String(max));
    if (minValue !== null && maxValue !== null && minValue > maxValue) { $('#resultCount').textContent = 'Minimum price must be below maximum price.'; return; }
    state.min = minValue; state.max = maxValue; state.visible = pageSize; setUrl(); render();
  }
  function searchSubmit(event) { event.preventDefault(); state.query = searchInput?.value.trim() || ''; state.visible = pageSize; setUrl(); render(); $('#catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  searchForm?.addEventListener('submit', searchSubmit);
  searchInput?.addEventListener('input', () => { state.query = searchInput.value.trim(); state.visible = pageSize; setUrl(); drawFacets(); render(); });
  $('#sortSelect')?.addEventListener('change', event => { state.sort = event.target.value; state.visible = pageSize; setUrl(); render(); });
  $('#applyPrice')?.addEventListener('click', () => applyPrice());
  document.querySelectorAll('.price-presets button').forEach(button => button.addEventListener('click', () => { const min = button.dataset.min === undefined ? null : Number(button.dataset.min); const max = button.dataset.max === undefined ? null : Number(button.dataset.max); $('#minPrice').value = min === null ? '' : min; $('#maxPrice').value = max === null ? '' : max; applyPrice(min, max); }));
  document.querySelectorAll('.facet-list').forEach(list => list.addEventListener('change', event => {
    if (!event.target.matches('input[data-facet]')) return;
    const type = event.target.dataset.facet, value = event.target.value, wasChecked = event.target.checked;
    if (type === 'brand') state.brand = wasChecked ? value : '';
    else if (type === 'size') state.size = wasChecked ? value : '';
    else if (wasChecked) state.categories.add(value); else state.categories.delete(value);
    state.visible = pageSize; setUrl(); drawFacets(); render();
  }));
  $('#clearFilters')?.addEventListener('click', () => { state.query = ''; state.min = state.max = null; state.brand = state.size = ''; state.categories.clear(); state.visible = pageSize; if (searchInput) searchInput.value = ''; if ($('#minPrice')) $('#minPrice').value = ''; if ($('#maxPrice')) $('#maxPrice').value = ''; if ($('#sortSelect')) $('#sortSelect').value = 'featured'; state.sort = 'featured'; setUrl(); drawFacets(); render(); });
  $('#loadMore')?.addEventListener('click', () => { state.visible += pageSize; render(); });

  const menu = $('#siteMenu'), menuToggle = $('.menu-toggle');
  function setMenu(open) { if (!menu || !menuToggle) return; menu.hidden = !open; menuToggle.setAttribute('aria-expanded', String(open)); if (open) $('.menu-close')?.focus(); else menuToggle.focus(); }
  menuToggle?.addEventListener('click', () => setMenu(menu.hidden)); $('.menu-close')?.addEventListener('click', () => setMenu(false));
  document.addEventListener('click', event => { if (menu && !menu.hidden && !menu.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false); });
  const filter = $('#filterPanel'), scrim = $('#filterScrim');
  function setFilter(open) { filter?.classList.toggle('open', open); scrim?.classList.toggle('open', open); document.body.style.overflow = open ? 'hidden' : ''; if (open) $('#filterClose')?.focus(); else $('#filterOpen')?.focus(); }
  $('#filterOpen')?.addEventListener('click', () => setFilter(true)); $('#filterClose')?.addEventListener('click', () => setFilter(false)); scrim?.addEventListener('click', () => setFilter(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { if (menu && !menu.hidden) setMenu(false); if (filter?.classList.contains('open')) setFilter(false); } });

  async function loadRotator() {
    const media = $('#heroMedia'); if (!media) return;
    let slides = [];
    try { const response = await fetch('/demo/liquorstore/content/hero-slides.json', { cache: 'no-store' }); if (response.ok) slides = await response.json(); } catch { /* Keep the designed single-slide fallback. */ }
    if (!Array.isArray(slides) || slides.length === 0) return;
    let index = 0, timer = 0;
    const controls = $('#rotatorControls'), dots = $('#heroDots');
    function show(next) {
      index = (next + slides.length) % slides.length; const slide = slides[index] || {};
      $('#heroEyebrow').textContent = slide.eyebrow || 'A good place to begin';
      const setLines = (element, value) => { if (!element) return; element.replaceChildren(); String(value || '').split('\n').forEach((line, i) => { if (i) element.append(document.createElement('br')); element.append(document.createTextNode(line)); }); };
      setLines($('#heroTitle'), slide.title || 'Make room for something good.');
      $('#heroText').textContent = slide.text || ''; setLines($('#heroCaption'), slide.caption || slide.title || ''); $('#heroSubcaption').textContent = slide.subcaption || '';
      const image = String(slide.image || '').trim();
      if (image && image.startsWith('/demo/liquorstore/images/rotators/')) { media.classList.add('has-image'); media.style.backgroundImage = `linear-gradient(90deg,#29251d20,#29251d35),url("${image.replace(/["\\]/g, '')}")`; media.setAttribute('aria-label', slide.alt || slide.title || 'Featured Bottle & Barrel selection'); }
      else { media.classList.remove('has-image'); media.style.backgroundImage = ''; }
      dots?.querySelectorAll('button').forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    }
    if (slides.length > 1 && controls && dots) {
      controls.hidden = false; dots.replaceChildren();
      slides.forEach((slide, i) => { const dot = document.createElement('button'); dot.type = 'button'; dot.setAttribute('aria-label', `Show feature ${i + 1}: ${slide.title || 'selection'}`); dot.addEventListener('click', () => { show(i); resetTimer(); }); dots.append(dot); });
      $('#heroPrev')?.addEventListener('click', () => { show(index - 1); resetTimer(); }); $('#heroNext')?.addEventListener('click', () => { show(index + 1); resetTimer(); });
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      function resetTimer() { clearInterval(timer); if (!reducedMotion) timer = setInterval(() => show(index + 1), 7000); }
      media.addEventListener('mouseenter', () => clearInterval(timer)); media.addEventListener('mouseleave', resetTimer); media.addEventListener('focusin', () => clearInterval(timer)); media.addEventListener('focusout', resetTimer); resetTimer();
    }
    show(0);
  }
  function setupCategory() {
    if (page !== 'category') return;
    const names = { wine: ['Wine', 'From relaxed weeknight glasses to bottles saved for a celebration.'], spirits: ['Spirits', 'Explore whiskey, tequila, gin, rum, and other carefully chosen favorites.'], beer: ['Beer', 'Discover crisp classics, local favorites, and something new for the cooler.'], gifts: ['Gifts & Extras', 'Thoughtful add-ons, glassware, and small things that make a good gathering.'] };
    const key = parentCategory.toLowerCase(), item = names[key] || [parentCategory, 'Thoughtfully chosen favorites, easy to explore and easy to enjoy.'];
    $('#categoryTitle').textContent = item[0]; $('#categoryIntro').textContent = item[1]; document.title = `${item[0]} | Bottle & Barrel`;
  }
  function setupAgePrompt() {
    const prompt = $('#agePrompt'); if (!prompt) return;
    try { if (sessionStorage.getItem('bb-age-ack') === 'yes') prompt.hidden = true; } catch { prompt.hidden = false; }
    $('#ageYes')?.addEventListener('click', () => { try { sessionStorage.setItem('bb-age-ack', 'yes'); } catch {} prompt.hidden = true; });
    $('#ageNo')?.addEventListener('click', () => { $('#ageStatus').textContent = 'This sample storefront is closed. You can close this window.'; });
  }
  async function loadCatalog() {
    try {
      const response = await fetch('/demo/liquorstore/content/catalog.json', { headers: { Accept: 'application/json' }, cache: 'no-cache' });
      const data = await response.json(); if (!response.ok || !Array.isArray(data.products)) throw new Error('The sample product collection could not be loaded.');
      state.products = data.products.filter(p => p.published !== false).map((p, i) => ({ ...p, sortOrder: p.sortOrder ?? i }));
      const store = data.store || {};
      const name = $('.brand-name'); if (name) { name.childNodes[0].textContent = store.name || 'Bottle & Barrel'; }
      const announcement = $('.utility-bar > span:first-child'); if (announcement && store.tagline) announcement.textContent = store.tagline;
      const location = $('.utility-location'); if (location && store.location) location.textContent = store.location;
      if (store.primaryColor) document.documentElement.style.setProperty('--ink', store.primaryColor);
      if (store.accentColor) document.documentElement.style.setProperty('--sage', store.accentColor);
      drawFacets(); render();
    } catch (error) { if (grid) { grid.replaceChildren(); const note = document.createElement('p'); note.className = 'empty-state'; note.textContent = `${error.message} Check that the site’s content/catalog.json file is present.`; grid.append(note); } }
  }
  setupCategory(); loadStateFromUrl(); setupAgePrompt(); loadRotator(); loadCatalog();
})();
