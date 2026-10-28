/* 904° MARK11.1 — purely fictional, silent terminal sequence.
 * The Door is a visual entry only; it never authorizes accounts or runs user code.
 */
(() => {
  'use strict';
  const destination = '/portal/';
  const code = document.getElementById('terminal-code');
  const decision = document.getElementById('decision');
  const yes = document.getElementById('choice-yes');
  const no = document.getElementById('choice-no');
  const chosen = document.getElementById('typed-choice');
  const returned = document.getElementById('return-message');
  const hello = document.getElementById('hello');
  const flash = document.getElementById('flash');
  const status = document.getElementById('sr-status');
  const controls = document.getElementById('door-controls');
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const timers = new Set();
  let timeout = null;
  let done = false;
  const announce = message => { status.textContent = message; };
  const schedule = (fn, ms) => {
    const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  };
  const cancelTimers = () => { timers.forEach(clearTimeout); timers.clear(); };
  const go = () => {
    if (done) return;
    done = true;
    cancelTimers();
    window.location.replace(destination);
  };

  // Demonstration only. Valid-looking C# text; never evaluated or sent anywhere.
  const lines = [
    'using System;',
    'using System.Collections.Generic;',
    'using System.Threading.Tasks;',
    '',
    'namespace NineZeroFour.SortOfSecretEntrance',
    '{',
    '    internal static class Bootstrap',
    '    {',
    '        private const string Environment = "AlmostProduction";',
    '        private static readonly bool CommonSenseInstalled = false;',
    '',
    '        public static async Task<int> InitializeAsync()',
    '        {',
    '            Console.WriteLine("904° core: initializing...");',
    '            await Task.Delay(904);',
    '            var pixels = new List<string> { "red", "green", "blue" };',
    '            pixels.Sort(); // Organization is the first step toward chaos.',
    '            if (!CommonSenseInstalled)',
    '                Console.WriteLine("Common sense missing. Proceeding normally.");',
    '            // TODO: Ask the rubber duck. It has seniority.',
    '            return 0; // Zero bugs detected. Confidence level: suspicious.',
    '        }',
    '    }',
    '}',
    '',
    '> Compiling improbable ideas.................... OK',
    '> Checking flux capacitor...................... NOT REQUIRED',
    '> Verifying coffee dependency................. CRITICAL',
    '> Locating exit to normalcy.................... MAYBE',
    '> Loading complete. Decision required.'
  ];
  let index = 0;
  function nextLine() {
    if (done) return;
    if (index >= lines.length) {
      decision.hidden = false;
      yes.focus({ preventScroll:true });
      decision.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block:'end' });
      announce('Warning. Cannot be undone. Execute? Choose Y or N.');
      // Only inactivity at the Y/N decision counts toward the two-minute timeout.
      timeout = schedule(() => choose('N'), 120000);
      return;
    }
    const line = lines[index++];
    code.textContent += line + '\n';
    code.scrollIntoView?.({behavior:'auto', block:'end'});
    const pace = reduced ? 0 : line.trim() === '' ? 200 : line.includes('//') ? 530 : 325;
    schedule(nextLine, pace);
  }
  function choose(choice) {
    if (done || decision.hidden || chosen.textContent) return;
    if (timeout !== null) { clearTimeout(timeout); timers.delete(timeout); timeout = null; }
    chosen.textContent = choice;
    yes.disabled = true;
    no.disabled = true;
    if (choice === 'Y') {
      announce('Executing. Hello World.');
      // Exactly two quick lime-to-black flashes, unless reduced motion is requested.
      const flashes = reduced ? [] : [
        [0,true],[125,false],[270,true],[395,false]
      ];
      flashes.forEach(([delay,active]) => schedule(() => flash.classList.toggle('is-active', active), delay));
      schedule(() => {
        flash.classList.remove('is-active');
        document.body.classList.add('showing-hello');
        controls.hidden = true;
        hello.hidden = false;
        // This is the only visible element during the 3.5 second hold.
        schedule(go, 3500);
      }, reduced ? 0 : 530);
    } else {
      announce('Ok, returning to normalcy. No secrets revealed.');
      returned.hidden = false;
      schedule(() => { decision.hidden = true; code.textContent = ''; document.getElementById('startup-prompt').hidden = true; }, 2100);
      schedule(go, 5700);
    }
  }
  yes.addEventListener('click', () => choose('Y'));
  no.addEventListener('click', () => choose('N'));
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || decision.hidden) return;
    const key = event.key.toUpperCase();
    if (key === 'Y' || key === 'N') { event.preventDefault(); choose(key); }
  });
  announce('904° SortOfSecretEntrance. Initializing fictional terminal.');
  schedule(nextLine, reduced ? 0 : 2600); // Let the first cursor hang in the darkness.
})();
