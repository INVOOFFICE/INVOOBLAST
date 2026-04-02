/**
 * Détecte la connectivité réseau pour les actions qui exigent Internet (envoi SMTP, IMAP, OAuth futur).
 */
(function (global) {
  'use strict';

  function isOnline() {
    return typeof navigator !== 'undefined' && navigator.onLine === true;
  }

  async function requireOnline(orMessage) {
    if (isOnline()) return true;
    const msg =
      orMessage ||
      'Cette action nécessite une connexion Internet. Vos données restent locales ; reconnectez-vous pour continuer.';
    throw new Error(msg);
  }

  function onNetworkChange(cb) {
    window.addEventListener('online', cb);
    window.addEventListener('offline', cb);
    return () => {
      window.removeEventListener('online', cb);
      window.removeEventListener('offline', cb);
    };
  }

   
  global.InvooNetwork = { isOnline, requireOnline, onNetworkChange };
})(typeof window !== 'undefined' ? window : self);
