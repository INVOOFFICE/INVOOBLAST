/**
 * En-têtes de pages et gabarit HTML injecté une fois dans #app-root.
 */
(function (global) {
  'use strict';

  function navIcon(pathD) {
    return `<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${pathD}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  const ICONS = {
    home: navIcon('M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z'),
    lists: navIcon('M4 6h16M4 12h10M4 18h16'),
    editor: navIcon('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z'),
    blast: navIcon('M22 2 11 13M22 2l-7 20-4-9-9-4Z'),
    imap: navIcon('M4 4h16v16H4zM22 8l-10 5L2 8'),
    settings: navIcon('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6 1.65 1.65 0 0 0 9.51 3H9a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z')
  };

  function shellHtml() {
    return `
<div class="backdrop" id="nav-backdrop" aria-hidden="true"></div>
<div class="app-shell">
  <aside class="sidebar" id="app-sidebar" aria-label="Navigation principale">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true">IB</div>
      <div>
        <div class="brand-title">INVOOBLAST</div>
        <div class="brand-sub">Campagnes 100 % locales</div>
      </div>
    </div>
    <div>
      <div class="nav-section">Espace de travail</div>
      <ul class="nav-list" role="navigation">
        <li class="nav-item active" data-page="dashboard" tabindex="0" role="link">${ICONS.home}<span>Tableau de bord</span></li>
        <li class="nav-item" data-page="contacts" tabindex="0" role="link">${ICONS.lists}<span>Listes & import</span></li>
        <li class="nav-item" data-page="editor" tabindex="0" role="link">${ICONS.editor}<span>Éditeur e-mail</span></li>
        <li class="nav-item" data-page="blast" tabindex="0" role="link">${ICONS.blast}<span>Envoi (Blast)</span></li>
        <li class="nav-item" data-page="imap" tabindex="0" role="link">${ICONS.imap}<span>IMAP & bounces</span></li>
      </ul>
    </div>
    <div style="margin-top:auto">
      <div class="nav-section">Système</div>
      <ul class="nav-list">
        <li class="nav-item" data-page="settings" tabindex="0" role="link">${ICONS.settings}<span>Paramètres</span></li>
      </ul>
    </div>
  </aside>
  <div class="main-area">
    <header class="topbar">
      <div style="display:flex;align-items:center;gap:0.75rem">
        <button type="button" class="icon-btn mob-nav-toggle" id="nav-open" aria-label="Ouvrir le menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <h1 class="page-title" id="page-title">Tableau de bord</h1>
      </div>
      <div class="topbar-right">
        <span class="status-pill" id="net-pill" aria-live="polite"><span class="status-dot" aria-hidden="true"></span><span id="net-label">Réseau</span></span>
        <button type="button" class="icon-btn" id="btn-install" hidden title="Installer l’application">⬇</button>
      </div>
    </header>
    <main class="content" id="main-content">
      <section class="page active" id="page-dashboard" data-page="dashboard"></section>
      <section class="page" id="page-contacts" data-page="contacts"></section>
      <section class="page" id="page-editor" data-page="editor"></section>
      <section class="page" id="page-blast" data-page="blast"></section>
      <section class="page" id="page-imap" data-page="imap"></section>
      <section class="page" id="page-settings" data-page="settings"></section>
    </main>
  </div>
</div>`;
  }

  /** Pages placeholder (hors dashboard complété à cette étape). */
  function placeholderPage(title, bodyHtml) {
    return `
<div class="panel">
  <div class="panel-h"><h2>${title}</h2></div>
  <div class="panel-b">${bodyHtml}</div>
</div>`;
  }

  const PLACEHOLDERS = {
    contacts: `<div id="lists-import-root"></div>`,
    editor: `<div id="email-editor-root"></div>`,
    blast: `<div id="blast-root"></div>`,
    imap: placeholderPage(
      'IMAP & bounces',
      `<p>Scan IMAP (30 jours) et nettoyage des listes : action réservée au mode en ligne. Hors ligne, cette page affiche un rappel explicite.</p>`
    ),
    settings: ''
  };

   
  global.InvooShell = { shellHtml, PLACEHOLDERS };
})(window);
