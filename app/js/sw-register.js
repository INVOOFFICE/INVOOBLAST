/**
 * Enregistre le Service Worker à la racine du dépôt ; le « scope » couvre tout le site pour le même origine.
 * Nécessite HTTPS ou localhost (pas file:// pour le SW).
 */
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    if (!window.isSecureContext) {
      console.warn('[INVOOBLAST] Service Worker indisponible : utilisez un serveur HTTP local (HTTPS ou localhost).');
      return;
    }
    const swUrl = new URL('../service-worker.js', window.location.href);
    const scopeUrl = new URL('../', window.location.href);
    navigator.serviceWorker
      .register(swUrl.href, { scope: scopeUrl.href })
      .then(() => console.info('[INVOOBLAST] Service Worker actif —', scopeUrl.href))
      .catch((err) => console.warn('[INVOOBLAST] Enregistrement SW refusé :', err));
  });
})();
