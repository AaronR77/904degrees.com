/*
 * 904° MARK13.2 — live session countdown and server-derived navigation.
 * D1 + Cloudflare Access enforce roles, never display logic.
 * Unauthenticated visitors to /portal/ see no Admin link or logout UI.
 */
(() => {
  'use strict';
  const area = document.currentScript?.dataset.portalArea;
  if (!['portal','admin','customer','showroom'].includes(area)) return;

  const logoutUrl = '/cdn-cgi/access/logout';
  const logoutButton = document.querySelector('[data-portal-logout]');
  const countdown = document.querySelector('[data-portal-session-remaining]');
  const ownerLinks = Array.from(document.querySelectorAll('[data-owner-nav], [data-owner-card]'));
  const candidates = area === 'portal' ? ['customer', 'admin', 'showroom'] : [area];
  let expiresAt = null;
  let authenticatedArea = null;
  let loggingOut = false;
  let previousError = false;
  let expireTimer = null;

  const sessionPath = a => a === 'showroom' ? '/showroom/session' : `/api/${a}/session`;
  const mePath = a => `/api/${a}/me`;

  function setOwnerVisibility(enabled) {
    ownerLinks.forEach(el => { el.hidden = !enabled; });
  }
  function setPortalAuthenticated(enabled) {
    if (area !== 'portal') return;
    if (countdown) countdown.hidden = !enabled;
    if (logoutButton) logoutButton.hidden = !enabled;
  }
  setOwnerVisibility(false); // Prevent even a momentary Admin flash for customers.
  if (logoutButton) logoutButton.href = logoutUrl;
  setPortalAuthenticated(false);

  async function safeJson(url) {
    try {
      const response = await fetch(url, {
        method:'GET', credentials:'same-origin', cache:'no-store', redirect:'manual',
        headers:{Accept:'application/json','X-Requested-With':'XMLHttpRequest'}
      });
      if (response.status === 401 || response.status === 403 || response.type === 'opaqueredirect') return {denied:true};
      if (!response.ok) return null;
      const data = await response.json();
      return data && typeof data === 'object' ? data : null;
    } catch (_) {return null;}
  }

  async function loadAccount() {
    let selected = null;
    for (const candidate of candidates) {
      const result = await safeJson(mePath(candidate));
      if (result?.denied && area !== 'portal') { logout(); return null; }
      if (!result?.ok || !result.account?.roles || result.account.status === 'suspended') continue;
      selected = { area:candidate, account:result.account };
      break;
    }
    if (selected) {
      authenticatedArea = selected.area;
      const roles = selected.account.roles;
      setOwnerVisibility(roles.admin === true || roles.owner === true);
      setPortalAuthenticated(true);
    } else {
      authenticatedArea = null;
      setOwnerVisibility(false);
      setPortalAuthenticated(false);
    }
    return selected;
  }

  function updateCountdown() {
    if (!countdown || loggingOut || (area === 'portal' && !authenticatedArea)) return;
    if (!Number.isFinite(expiresAt)) {
      countdown.textContent = previousError ? 'Login time unavailable' : 'Checking login time…';
      return;
    }
    const total = Math.max(0, Math.ceil((expiresAt-Date.now())/1000));
    const hours = Math.floor(total/3600);
    const minutes = String(Math.floor(total%3600/60)).padStart(2,'0');
    const seconds = String(total%60).padStart(2,'0');
    countdown.textContent = `${hours}:${minutes}:${seconds} Login Time Remaining`;
  }

  function logout() {
    if (loggingOut) return;
    loggingOut = true;
    setOwnerVisibility(false);
    if (countdown) countdown.textContent = '0:00:00 Login Time Remaining';
    window.location.replace(logoutUrl);
  }
  function checkExpiry() {
    if (Number.isFinite(expiresAt) && Date.now() >= expiresAt) logout();
  }
  function scheduleExpiry(when) {
    if (!Number.isFinite(when) || when <= 0 || loggingOut) return;
    expiresAt=when;
    updateCountdown();
    if (expireTimer) clearTimeout(expireTimer);
    const remaining=when-Date.now();
    if (remaining <= 0) {logout();return;}
    expireTimer=setTimeout(checkExpiry, Math.min(remaining+20,60000));
  }

  async function loadVerifiedExpiry() {
    if (loggingOut) return;
    const selected = await loadAccount();
    if (!selected) {
      if (area !== 'portal') {
        // The current area has to be authenticated to be useful. Do not
        // redirect after a transient network failure; the server still enforces.
        previousError=true;
        updateCountdown();
      } else {expiresAt=null;}
      return;
    }
    const result = await safeJson(sessionPath(selected.area));
    if (result?.denied && area !== 'portal') {logout();return;}
    if (!result || result.area!==selected.area || !Number.isFinite(result.expiresAt)) {
      previousError=true;updateCountdown();return;
    }
    previousError=false;
    scheduleExpiry(result.expiresAt);
  }

  window.addEventListener('pageshow', event=>{checkExpiry();if(event.persisted)loadVerifiedExpiry();});
  window.addEventListener('focus',checkExpiry);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkExpiry();loadVerifiedExpiry();}});
  window.setInterval(checkExpiry,30000);
  window.setInterval(()=>{updateCountdown();checkExpiry();},1000);
  loadVerifiedExpiry();
})();
