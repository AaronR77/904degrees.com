/* 904° MARK11 — public homepage interactions. No authentication decisions here. */
(() => {
  'use strict';
  const navButton = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.primary-nav');
  if (navButton && nav) {
    const setNav = open => {
      nav.classList.toggle('is-open', open);
      navButton.setAttribute('aria-expanded', String(open));
      navButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    };
    navButton.addEventListener('click', () => setNav(navButton.getAttribute('aria-expanded') !== 'true'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNav(false)));
    document.addEventListener('click', event => { if (!event.target.closest('.header-inner')) setNav(false); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') setNav(false); });
  }

  const button = document.querySelector('.affiliate-degree');
  const menu = document.querySelector('.affiliate-links');
  if (!button || !menu) return;
  const setMenu = open => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  };
  button.addEventListener('click', () => setMenu(button.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('click', event => { if (!event.target.closest('.affiliate-menu')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });

  // Take a visual snapshot of the actual current page using clipped DOM tiles.
  // No screenshot/canvas upload and no third-party tracking or scripts are needed.
  const door = menu.querySelector('a[href="/nondescript/"]');
  let enteringDoor = false;
  door?.addEventListener('click', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (enteringDoor) return;
    enteringDoor = true;
    const destination = door.getAttribute('href'); // Fixed same-origin path.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !Element.prototype.animate) { window.location.assign(destination); return; }
    try {
      const viewWidth = window.innerWidth;
      const viewHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      // Approximately square cells across landscape and portrait screens.
      const side = Math.max(96, Math.min(148, Math.round(Math.min(viewWidth, viewHeight) / 5)));
      const cols = Math.ceil(viewWidth / side);
      const rows = Math.ceil(viewHeight / side);
      const overlay = document.createElement('div');
      overlay.className = 'door-fracture-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      const sources = [...document.querySelectorAll('.background-grid, .ambient, .site-header, .signal-bar, main, .site-footer')];
      const fragment = document.createDocumentFragment();
      const tiles = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * side, y = r * side;
          const tile = document.createElement('div');
          tile.className = 'door-fracture-tile';
          tile.style.left = `${x}px`;
          tile.style.top = `${y}px`;
          tile.style.width = `${Math.min(side, viewWidth - x)}px`;
          tile.style.height = `${Math.min(side, viewHeight - y)}px`;
          const snapshot = document.createElement('div');
          snapshot.className = 'door-fracture-snapshot';
          snapshot.style.left = `${-x}px`;
          snapshot.style.top = `${-y - scrollTop}px`;
          sources.forEach(source => snapshot.appendChild(source.cloneNode(true)));
          tile.appendChild(snapshot);
          fragment.appendChild(tile);
          tiles.push(tile);
        }
      }
      overlay.appendChild(fragment);
      document.body.appendChild(overlay);
      // Ensure the intact tiled image is visible before the pieces begin to detach.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const random = n => { // Reproducible but irregular movement for each tile.
          const v = Math.sin((n + 1) * 127.1) * 43758.5453;
          return v - Math.floor(v);
        };
        tiles.forEach((tile, n) => {
          const delay = Math.round(350 + random(n * 3) * 1450);
          const distance = 110 + random(n * 5) * viewHeight * 0.85;
          const drift = (random(n * 7) - .5) * 175;
          const spin = (random(n * 11) - .5) * 38;
          tile.animate([
            { transform:'translate(0,0) rotate(0deg)', opacity:1, filter:'brightness(1)' },
            { transform:`translate(${drift * .2}px,${distance * .08}px) rotate(${spin * .18}deg)`, opacity:1, filter:'brightness(.82)', offset:.2 },
            { transform:`translate(${drift}px,${distance}px) rotate(${spin}deg)`, opacity:0, filter:'brightness(.18)' }
          ], { duration:1850, delay, easing:'cubic-bezier(.3,.04,.7,1)', fill:'forwards' });
        });
      }));
      window.setTimeout(() => window.location.assign(destination), 4200);
    } catch (_) {
      window.location.assign(destination);
    }
  });
})();
