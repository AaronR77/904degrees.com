/*
 * 904° MARK13.1 — protected-portal session controls and visible countdown.
 * Cloudflare Access + Pages middleware are authoritative. The browser timer
 * is an additional visible-page safeguard, NOT a substitute for server auth.
 * Manual logout uses Cloudflare's documented, app-domain logout endpoint.
 */
(() => {
  'use strict';
  const script = document.currentScript;
  const area = script?.dataset.portalArea;
  if (!['admin', 'customer', 'showroom'].includes(area)) return;

  const logoutUrl = '/cdn-cgi/access/logout';
  const sessionApi = area === 'showroom' ? '/showroom/session' : '/api/' + area + '/session';
  const logoutButton = document.querySelector('[data-portal-logout]');
  const countdown = document.querySelector('[data-portal-session-remaining]');
  if (logoutButton) logoutButton.href = logoutUrl;
  if (countdown) countdown.textContent = 'Checking login time…';

  let expiresAt = null;
  let timer = null;
  let loggingOut = false;
  let previousError = false;

  // This is a display only. Pages Functions and Access verify every request.
  // The expiration comes from the server-verified Access JWT, not a fresh
  // six-/24-hour clock started by the browser.
  function updateCountdown() {
    if (!countdown || loggingOut) return;
    if (!Number.isFinite(expiresAt)) {
      countdown.textContent = previousError ? 'Login time unavailable' : 'Checking login time…';
      return;
    }
    const total = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = String(Math.floor(total % 3600 / 60)).padStart(2, '0');
    const seconds = String(total % 60).padStart(2, '0');
    countdown.textContent = `${hours}:${minutes}:${seconds} Login Time Remaining`;
  }

  function logout() {
    if (loggingOut) return;
    loggingOut = true;
    if (countdown) countdown.textContent = '0:00:00 Login Time Remaining';
    // Do not load private content after this point. Cloudflare clears Access
    // authorization and can revoke the session on its own managed endpoint.
    window.location.replace(logoutUrl);
  }

  function scheduleExpiry(when) {
    if (!Number.isFinite(when) || when <= 0) return;
    expiresAt = when;
    updateCountdown();
    if (timer) window.clearTimeout(timer);
    const remaining = when - Date.now();
    if (remaining <= 0) { logout(); return; }
    // Browsers clamp timers when tabs sleep; pageshow/visibilitychange/focus
    // and a periodic check below also enforce the deadline on waking.
    timer = window.setTimeout(checkExpiry, Math.min(remaining + 20, 60000));
  }

  function checkExpiry() {
    if (expiresAt !== null && Date.now() >= expiresAt) {
      logout();
      return;
    }
    if (expiresAt !== null) scheduleExpiry(expiresAt);
  }

  async function loadVerifiedExpiry() {
    if (loggingOut) return;
    try {
      const response = await fetch(sessionApi, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        redirect: 'manual'
      });
      if (response.status === 401 || response.status === 403 || response.type === 'opaqueredirect') {
        logout();
        return;
      }
      if (!response.ok) throw new Error('Session status unavailable');
      const data = await response.json();
      if (data.area !== area || !Number.isFinite(data.expiresAt)) throw new Error('Invalid session response');
      scheduleExpiry(data.expiresAt);
      previousError = false;
      updateCountdown();
    } catch (_error) {
      // Brief network failures do not revoke otherwise valid sessions. Access
      // and the Pages Function continue validating every protected request.
      if (!previousError) console.warn('904°: Session status could not be checked. Access enforcement remains active.');
      previousError = true;
      updateCountdown();
    }
  }

  window.addEventListener('pageshow', event => {
    checkExpiry();
    if (event.persisted) loadVerifiedExpiry();
  });
  window.addEventListener('focus', checkExpiry);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { checkExpiry(); loadVerifiedExpiry(); }
  });
  loadVerifiedExpiry();
  // Handles browser clock shifts or long inactive background tabs.
  window.setInterval(checkExpiry, 30000);
  // Update the clock every second even while the user does nothing.
  // Date.now() also catches clock jumps and throttled background tabs.
  window.setInterval(() => { updateCountdown(); checkExpiry(); }, 1000);
})();
