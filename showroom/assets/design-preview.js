(() => {
  'use strict';
  const shell = document.querySelector('.browser-shell');
  const buttons = [...document.querySelectorAll('[data-preview-size]')];
  buttons.forEach(button => button.addEventListener('click', () => {
    shell.classList.remove('frame-tablet', 'frame-mobile');
    const size = button.dataset.previewSize;
    if (size !== 'desktop') shell.classList.add('frame-' + size);
    buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  }));
})();
