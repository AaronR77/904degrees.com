/* 904° MARK10: shared Portal enhancement; design catalog now lives in
 * /showroom/assets/showroom.js, populated by /showroom/catalog/designs.json.
 * Kept only for any older embedded preview controls still using this script.
 */
(() => {
  'use strict';
  document.querySelectorAll('[data-preview-size]').forEach(button => {
    button.addEventListener('click', () => {
      const shell = document.querySelector('.preview-shell');
      if (!shell) return;
      shell.classList.remove('mobile', 'tablet');
      if (button.dataset.previewSize !== 'desktop') shell.classList.add(button.dataset.previewSize);
      document.querySelectorAll('[data-preview-size]').forEach(other => {
        other.setAttribute('aria-pressed', String(other === button));
      });
    });
  });
})();
