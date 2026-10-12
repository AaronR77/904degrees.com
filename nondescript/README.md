# The Nondescript Door — Cinematic Release 1 (MARK05)

This folder **replaces only the older `/nondescript/` experience**. It is integrated with the existing MARK04 homepage's footer dropdown and the existing `/portal/` destination. Everything else in the website remains as it was in MARK04, except for one added event handler in `/js/home.js` to capture the footer's degree-symbol position before navigation.

## Deployment / local test

1. Back up the current 904degrees.com working folder.
2. Extract the full MARK05 archive to a separate location. Its top-level `904degrees.com/` folder corresponds to your site's existing folder. Compare changes, then copy/merge the contents of that folder into your working site folder; do not put a nested `904degrees.com` folder inside it.
3. Start a local server **at the site root** using `py -m http.server 8080` on Windows. Visit `http://localhost:8080/`, scroll to the degree-symbol footer dropdown, and select **The Nondescript Door**. Do not use `file://` paths; the site uses root-relative URLs.
4. Confirm SKIP goes directly to `/portal/`. Test soundtrack mute, desktop/mobile layout, repeat visits, and browser reduced-motion mode. After review, commit via GitHub Desktop and deploy through the existing Cloudflare Pages workflow.
5. If caching shows the older effect, hard-refresh the page. Asset URLs are versioned `?v=1.0.0`.

## Locked cinematic timeline

- Loading (variable): glowing degree energy-charge gate; the footer degree animates visually toward the center when visited through the homepage link.
- 0–8 seconds: zooming descent through °; accelerating starfield; rotating lime rings, plasma ribbons and electric arcs; energy overload; lime-and-black plaid during seconds 6–8; implosion and intentionally silly dying-tape sound.
- 8–9.5 seconds: total blackout.
- 9.5–13.5 seconds: progressive failure of the site's own 904° logo reboot.
- 13.5–18.5 seconds: DOS recovery terminal fights itself, upgrades into a futuristic recovery display, and completes its reboot without pausing for visitor input.
- 18.5–22.5 seconds: automatic jagged dimensional tear, 4–6 randomized alternate realities, assorted transition artifacts, then one random final wrong-universe joke.
- 22.5–23.35 seconds: the actual Portal page is briefly shown in a preloaded frame underneath a tile-reassembly transition. Navigation finishes at `/portal/`.

## Controls, safety, compatibility

- Bottom auto-hiding control strip has **SOUND** and **SKIP**. Pointer/touch/keyboard interaction reveals it. Escape or S skips immediately; the SKIP button is also a real HTML link if JavaScript fails.
- Original soundtrack is synthesized in-browser using Web Audio API. Audio begins only when browser policy permits it; otherwise the show continues silently, with no dialog. Mute is available any time.
- Original shader and particle effects use built-in WebGL 1.0. No Three.js or other external JS dependency is needed.
- If WebGL is unavailable at the start, Canvas 2D and CSS reproduce the story. If active rendering fails **mid-show**, a simple four-second HTML/CSS comedy error redirects to the Portal. If even that script cannot run, the native SKIP link still works.
- Particle counts and render scale automatically adapt to devices and runtime frame rate; `prefers-reduced-motion: reduce` switches to a calm 2D variant, gentler fades and no aggressive flickering.
- No login, database, analytics, hidden terminal, achievement tracking, or extra website routes are introduced in this release. The spaceship bridge, secret command system and discovery archive remain **deferred**, not deleted from the design.

## Test-only shortcuts

Localhost only: append `?ndtest=1` to `/nondescript/`. In the browser Developer Tools console you can run `NDDebug.jump(6.5)` to inspect plaid, `NDDebug.jump(19.5)` to inspect dimensions, or `NDDebug.fail()` to test the emergency screen. These controls do not exist on the production hostname.

## Files changed versus MARK04

- `nondescript/index.html` — complete rebuild.
- `nondescript/assets/cinematic.css` — cinematic layout, loader, UI, scenes and accessibility.
- `nondescript/assets/cinematic.js` — centralized timeline, controls, errors and arrival.
- `nondescript/assets/renderer.js` — WebGL starfield and energy tunnel, 2D fallback, quality scaling.
- `nondescript/assets/audio.js` — original browser-generated soundtrack and effects.
- `nondescript/assets/realities.js` — procedural alternate-universe visuals, randomized final joke.
- `js/home.js` — harmless event listener for glowing footer degree origin.

**No other existing files were modified.**
