/**
 * Modale de confirmation intégrée au thème INVOOBLAST (remplace window.confirm).
 */
(function (global) {
  'use strict';

  let root = null;
  let resolver = null;

  function onEscape(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close(false);
    }
  }

  function close(val) {
    if (!root) return;
    root.hidden = true;
    document.body.classList.remove('app-confirm-open');
    document.removeEventListener('keydown', onEscape);
    const r = resolver;
    resolver = null;
    if (r) r(!!val);
  }

  function ensure() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'app-confirm-layer';
    root.className = 'app-confirm-layer';
    root.hidden = true;
    root.innerHTML = `
<div class="app-confirm-backdrop" aria-hidden="true"></div>
<div class="app-confirm-panel" role="dialog" aria-modal="true" aria-labelledby="app-confirm-title">
  <h3 id="app-confirm-title" class="app-confirm-title"></h3>
  <p id="app-confirm-message" class="app-confirm-message"></p>
  <div class="app-confirm-actions">
    <button type="button" class="btn" id="app-confirm-cancel"></button>
    <button type="button" class="btn primary" id="app-confirm-ok"></button>
  </div>
</div>`;
    document.body.appendChild(root);
    root.querySelector('.app-confirm-backdrop').addEventListener('click', () => close(false));
    root.querySelector('#app-confirm-cancel').addEventListener('click', () => close(false));
    root.querySelector('#app-confirm-ok').addEventListener('click', () => close(true));
    return root;
  }

  /**
   * @param {{ title?: string, message: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} opts
   * @returns {Promise<boolean>}
   */
  function show(opts) {
    const o = opts && typeof opts === 'object' ? opts : { message: String(opts || '') };
    const title = o.title != null ? String(o.title) : 'Confirmation';
    const message = o.message != null ? String(o.message) : '';
    const confirmLabel = o.confirmLabel != null ? String(o.confirmLabel) : 'OK';
    const cancelLabel = o.cancelLabel != null ? String(o.cancelLabel) : 'Annuler';
    const danger = !!o.danger;

    return new Promise((resolve) => {
      if (resolver) resolver(false);
      resolver = resolve;

      const el = ensure();
      el.querySelector('#app-confirm-title').textContent = title;
      el.querySelector('#app-confirm-message').textContent = message;
      const btnOk = el.querySelector('#app-confirm-ok');
      const btnCancel = el.querySelector('#app-confirm-cancel');
      btnOk.textContent = confirmLabel;
      btnCancel.textContent = cancelLabel;
      btnOk.className = danger ? 'btn danger' : 'btn primary';

      el.hidden = false;
      document.body.classList.add('app-confirm-open');
      document.addEventListener('keydown', onEscape);

      setTimeout(() => {
        try {
          (danger ? btnCancel : btnOk).focus();
        } catch (_) {}
      }, 10);
    });
  }

  global.InvooConfirm = { show };
})(typeof window !== 'undefined' ? window : self);
