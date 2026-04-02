/**
 * Point d’entrée : hydrate l’interface, IndexedDB, navigation et messages hors ligne.
 */
(function () {
  'use strict';

  const db = window.InvooBlastDB;
  const shell = window.InvooShell;
  const nav = window.InvooNavigation;
  const dash = window.InvooDashboard;
  const net = window.InvooNetwork;
  function showToast(message, isError) {
    const el = document.getElementById('app-toast');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    el.classList.toggle('error', !!isError);
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 5200);
  }

  function updateNetPill() {
    const pill = document.getElementById('net-pill');
    const label = document.getElementById('net-label');
    if (!pill || !label) return;
    const online = net.isOnline();
    pill.classList.toggle('online', online);
    pill.classList.toggle('offline', !online);
    label.textContent = online ? 'En ligne' : 'Hors ligne';
  }

  function wireNetPill() {
    updateNetPill();
    net.onNetworkChange(updateNetPill);
  }

  function wireOnlineOnlyPages() {
    window.addEventListener('invooblast:page', (e) => {
      const page = e.detail && e.detail.page;
      if (page === 'imap' && !net.isOnline()) {
        showToast('Scan IMAP et détection des bounces : connexion Internet requise. Les listes restent disponibles hors ligne.', false);
      }
      if (page === 'blast' && !net.isOnline()) {
        showToast('Envoi réel : connexion requise. Vous pouvez préparer la campagne et le brouillon e-mail hors ligne.', false);
      }
    });
  }

  let deferredPrompt = null;
  function wireInstall() {
    const btn = document.getElementById('btn-install');
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (btn) {
        btn.hidden = false;
        btn.addEventListener(
          'click',
          async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            btn.hidden = true;
          },
          { once: true }
        );
      }
    });
  }

  async function boot() {
    await db.openDB();
    await db.seedIfEmpty();
    if (window.InvooCryptoVault && typeof window.InvooCryptoVault.ensureUnlockedForDevice === 'function') {
      await window.InvooCryptoVault.ensureUnlockedForDevice();
    }

    const root = document.getElementById('app-root');
    root.innerHTML = shell.shellHtml() + `<div id="app-toast" class="app-toast" role="status" aria-live="polite" hidden></div>`;

    /** Placeholders des écrans secondaires (le dashboard est rendu par InvooDashboard). */
    document.getElementById('page-contacts').innerHTML = shell.PLACEHOLDERS.contacts;
    document.getElementById('page-editor').innerHTML = shell.PLACEHOLDERS.editor;
    document.getElementById('page-blast').innerHTML = shell.PLACEHOLDERS.blast;
    document.getElementById('page-imap').innerHTML = shell.PLACEHOLDERS.imap;
    document.getElementById('page-settings').innerHTML = shell.PLACEHOLDERS.settings;

    nav.initNavigation();
    dash.wireDashboardRefresh();
    wireNetPill();
      wireOnlineOnlyPages();
    wireInstall();

    await dash.refreshDashboard();
    updateNetPill();

    if (window.InvooEmailEditor && typeof window.InvooEmailEditor.init === 'function') {
      window.InvooEmailEditor.init();
    }

    if (window.InvooSettings && typeof window.InvooSettings.init === 'function') {
      window.InvooSettings.init();
    }

    if (window.InvooBlastPage && typeof window.InvooBlastPage.init === 'function') {
      window.InvooBlastPage.init();
    }

    if (window.InvooListsImport && typeof window.InvooListsImport.init === 'function') {
      window.InvooListsImport.init();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    boot().catch((err) => console.error('[INVOOBLAST]', err));
  });

  window.InvooApp = { showToast };
})();
