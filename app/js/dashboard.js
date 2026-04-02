/**
 * Tableau de bord : agrège les statistiques locales (IndexedDB) et l’état réseau.
 */
(function (global) {
  'use strict';

  const db = global.InvooBlastDB;
  const net = global.InvooNetwork;

  function formatInt(n) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
  }

  function renderStats(container, stats) {
    container.innerHTML = `
      <div class="grid-stats">
        <article class="stat-card">
          <div class="stat-label">Contacts (tous)</div>
          <div class="stat-value">${formatInt(stats.contactCount)}</div>
          <div class="stat-hint">${formatInt(stats.validContactCount)} valides</div>
        </article>
        <article class="stat-card">
          <div class="stat-label">Listes</div>
          <div class="stat-value">${formatInt(stats.listCount)}</div>
          <div class="stat-hint">Import Excel/CSV local</div>
        </article>
        <article class="stat-card">
          <div class="stat-label">Brouillon éditeur</div>
          <div class="stat-value">${stats.emailDraftActive ? 'Oui' : '—'}</div>
          <div class="stat-hint">Objet ou corps enregistré · section Éditeur</div>
        </article>
        <article class="stat-card">
          <div class="stat-label">Campagnes</div>
          <div class="stat-value">${formatInt(stats.campaignCount)}</div>
          <div class="stat-hint">${formatInt(stats.activeCampaignCount)} actives / brouillon</div>
        </article>
        <article class="stat-card">
          <div class="stat-label">Envois 24 h</div>
          <div class="stat-value">${formatInt(stats.sentToday)}</div>
          <div class="stat-hint">${formatInt(stats.failedToday)} échecs</div>
        </article>
        <article class="stat-card">
          <div class="stat-label">Comptes Gmail (pool)</div>
          <div class="stat-value">${formatInt(stats.activeGmailAccountCount)}</div>
          <div class="stat-hint">sur ${formatInt(stats.gmailAccountCount)} configurés</div>
        </article>
      </div>
      <div class="panel">
        <div class="panel-h">
          <h2>Historique local</h2>
          <span style="font-size:0.85rem;color:var(--text-muted)">${formatInt(stats.historyTotal)} entrées indexées</span>
        </div>
        <div class="panel-b">
          Les journaux d’envoi et les checkpoints de reprise sont stockés dans IndexedDB sur cet appareil uniquement.
          Aucune synchronisation cloud n’est effectuée par l’application.
        </div>
      </div>`;
  }

  async function refreshDashboard() {
    const root = document.getElementById('page-dashboard');
    if (!root) return;
    const stats = await db.getDashboardStats();

    const online = net.isOnline();

    root.innerHTML = `
      ${!online ? `<div class="banner info" role="status"><div><h3>Mode hors ligne</h3><p>Vous pouvez préparer listes, brouillon e-mail et files d’attente. L’envoi SMTP / API et le scan IMAP nécessitent une connexion.</p></div></div>` : ''}
      <div id="dash-stats-root"></div>
    `;

    const mount = document.getElementById('dash-stats-root');
    renderStats(mount, stats);
  }

  function wireDashboardRefresh() {
    global.addEventListener('invooblast:page', (e) => {
      if (e.detail && e.detail.page === 'dashboard') refreshDashboard();
    });
    global.addEventListener('online', () => refreshDashboard());
    global.addEventListener('offline', () => refreshDashboard());
  }

   
  global.InvooDashboard = { refreshDashboard, wireDashboardRefresh };
})(window);
