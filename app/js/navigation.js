/**
 * Navigation SPA légère entre sections (sans routeur URL pour rester 100 % statique).
 */
(function (global) {
  'use strict';

  const PAGE_TITLES = {
    dashboard: 'Tableau de bord',
    contacts: 'Listes & import',
    editor: 'Éditeur e-mail',
    blast: 'Envoi (Blast)',
    imap: 'IMAP & bounces',
    settings: 'Paramètres'
  };

  function setActivePage(pageId) {
    document.querySelectorAll('.nav-item[data-page]').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-page') === pageId);
    });
    document.querySelectorAll('.page[data-page]').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-page') === pageId);
    });
    const t = document.getElementById('page-title');
    if (t) t.textContent = PAGE_TITLES[pageId] || pageId;

    global.dispatchEvent(new CustomEvent('invooblast:page', { detail: { page: pageId } }));

    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('nav-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('show');
  }

  function initNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach((el) => {
      const go = () => setActivePage(el.getAttribute('data-page'));
      el.addEventListener('click', go);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      });
    });

    const open = document.getElementById('nav-open');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('nav-backdrop');
    if (open && sidebar && backdrop) {
      open.addEventListener('click', () => {
        sidebar.classList.add('open');
        backdrop.classList.add('show');
      });
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
      });
    }
  }

   
  global.InvooNavigation = { initNavigation, setActivePage, PAGE_TITLES };
})(window);
