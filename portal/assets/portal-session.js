/*
 * 904° MARK07 — protected-portal session controls.
 * Cloudflare Access + Pages middleware are authoritative. The browser timer
 * is an additional visible-page safeguard, NOT a substitute for server auth.
 * Manual logout uses Cloudflare's documented, app-domain logout endpoint.
 */
(() => {
  'use strict';
  const script = document.currentScript;
  const area = script?.dataset.portalArea;
  if (area !== 'admin' && area !== 'customer') return;

  const logoutUrl = '/cdn-cgi/access/logout';
  const sessionApi = '/api/' + area + '/session';
  const logoutButton = document.querySelector('[data-portal-logout]');
  if (logoutButton) logoutButton.href = logoutUrl;

  let expiresAt = null;
  let timer = null;
  let loggingOut = false;
  let previousError = false;

  function logout() {
    if (loggingOut) return;
    loggingOut = true;
    // Do not load private content after this point. Cloudflare clears Access
    // authorization and can revoke the session on its own managed endpoint.
    window.location.replace(logoutUrl);
  }

  function scheduleExpiry(when) {
    if (!Number.isFinite(when) || when <= 0) return;
    expiresAt = when;
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
    } catch (_error) {
      // Brief network failures do not revoke otherwise valid sessions. Access
      // and the Pages Function continue validating every protected request.
      if (!previousError) console.warn('904°: Session status could not be checked. Access enforcement remains active.');
      previousError = true;
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
})();
