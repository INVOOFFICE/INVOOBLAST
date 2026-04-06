/**
 * Tableau de bord : agrège les statistiques locales (IndexedDB), l’état réseau et les raccourcis vers l’espace de travail.
 */
(function (global) {
  'use strict';

  const db = global.InvooBlastDB;
  const net = global.InvooNetwork;

  function formatInt(n) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatLogTime(ts) {
    if (ts == null || !isFinite(ts)) return '—';
    try {
      return new Date(ts).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return '—';
    }
  }

  function profileSummaryLine(raw) {
    const p = raw && typeof raw === 'object' ? raw : {};
    const fn = String(p.firstName || '').trim();
    const ln = String(p.lastName || '').trim();
    const em = String(p.email || '').trim();
    const name = [fn, ln].filter(Boolean).join(' ');
    if (name && em) return { html: `${escapeHtml(name)} <span class="dash-profile-sep">·</span> ${escapeHtml(em)}`, ok: true };
    if (name) return { html: escapeHtml(name), ok: true };
    if (em) return { html: escapeHtml(em), ok: true };
    return { html: '', ok: false };
  }

  function buildContextualBanners(stats, online) {
    const out = [];
    if (online && stats.validContactCount === 0) {
      out.push({
        cls: 'info',
        title: 'Contacts',
        html: 'Importez une liste (Excel ou CSV) depuis <strong>Listes & import</strong> pour préparer un envoi.'
      });
    }
    if (online && stats.gmailAccountCount === 0) {
      out.push({
        cls: 'warn',
        title: 'Comptes Gmail',
        html: 'Ajoutez au moins un compte Gmail (mot de passe d’application) dans <strong>Paramètres</strong> pour l’envoi Blast.'
      });
    } else if (online && stats.gmailAccountCount > 0 && stats.activeGmailAccountCount === 0) {
      out.push({
        cls: 'warn',
        title: 'Pool Gmail',
        html: 'Tous les comptes du pool sont désactivés — réactivez-les ou ajoutez un compte actif dans <strong>Paramètres</strong>.'
      });
    }
    return out.slice(0, 3);
  }

  const QUICK_PAGES = [
    {
      page: 'contacts',
      title: 'Listes & import',
      hint: 'Excel / CSV, colonnes et validation'
    },
    {
      page: 'editor',
      title: 'Éditeur e-mail',
      hint: 'Brouillon, variables {{…}}, aperçu profil'
    },
    {
      page: 'blast',
      title: 'Envoi (Blast)',
      hint: 'Campagne, file d’attente, rotation Gmail'
    },
    {
      page: 'imap',
      title: 'IMAP & bounces',
      hint: 'Scan boîte et nettoyage des listes'
    },
    {
      page: 'settings',
      title: 'Paramètres',
      hint: 'Profil, Blast, pool Gmail, sauvegarde'
    }
  ];

  function renderQuickNav() {
    return `
      <div class="dash-block">
        <h2 class="dash-section-title">Accès rapide</h2>
        <p class="dash-section-lead">Même ordre que le menu latéral — raccourcis vers chaque étape du flux.</p>
        <div class="dash-quick-grid" role="navigation" aria-label="Accès rapide aux sections">
          ${QUICK_PAGES.map(
            (x) => `
          <button type="button" class="dash-quick-card" data-dash-page="${escapeHtml(x.page)}">
            <span class="dash-quick-card-title">${escapeHtml(x.title)}</span>
            <span class="dash-quick-card-hint">${escapeHtml(x.hint)}</span>
          </button>`
          ).join('')}
        </div>
      </div>`;
  }

  function renderStats(container, stats) {
    container.innerHTML = `
      <div class="dash-block">
        <h2 class="dash-section-title">Indicateurs</h2>
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
      </div>
      <div class="panel dash-panel-foot">
        <div class="panel-h">
          <h2>Historique d’envoi (local)</h2>
          <span style="font-size:0.85rem;color:var(--text-muted)">${formatInt(stats.historyTotal)} entrées indexées</span>
        </div>
        <div class="panel-b">
          Les journaux d’envoi et les checkpoints de reprise sont stockés dans IndexedDB sur cet appareil uniquement.
          Aucune synchronisation cloud n’est effectuée par l’application.
        </div>
      </div>`;
  }

  function renderProfilePanel(profileRaw) {
    const sum = profileSummaryLine(profileRaw);
    const inner = sum.ok
      ? `<p class="dash-profile-line">${sum.html}</p>`
      : `<p class="dash-profile-line dash-profile-missing">Renseignez au moins le <strong>nom</strong> et l’<strong>e-mail</strong> dans Paramètres pour personnaliser les modèles.</p>`;
    return `
      <div class="panel dash-profile-panel">
        <div class="panel-h"><h2>Profil actif (Paramètres)</h2></div>
        <div class="panel-b">
          ${inner}
          <p class="editor-hint" style="margin:0.5rem 0 0.65rem 0;line-height:1.45">Pour l’envoi, l’<strong>Éditeur e-mail</strong> peut lier un <strong>autre profil au brouillon</strong> — la ligne « Profil (fusion) » sur <strong>Envoi (Blast)</strong> indique celui qui sera réellement fusionné.</p>
          <button type="button" class="btn btn-small dash-profile-btn" data-dash-page="settings">Ouvrir Paramètres</button>
        </div>
      </div>`;
  }

  function renderLogsPanel(logs) {
    if (!logs.length) {
      return `
      <div class="panel">
        <div class="panel-h"><h2>Journal applicatif</h2></div>
        <div class="panel-b"><p class="editor-hint" style="margin:0">Aucune entrée pour l’instant. Les actions (import, sauvegarde, envoi) apparaîtront ici.</p></div>
      </div>`;
    }
    const rows = logs
      .map(
        (row) => `
      <li class="dash-log-row">
        <span class="dash-log-time">${escapeHtml(formatLogTime(row.ts))}</span>
        <span class="dash-log-level dash-log-level--${escapeHtml(String(row.level || 'info'))}">${escapeHtml(String(row.level || 'info'))}</span>
        <span class="dash-log-msg">${escapeHtml(row.message || '')}</span>
      </li>`
      )
      .join('');
    return `
      <div class="panel">
        <div class="panel-h">
          <h2>Journal récent</h2>
          <span style="font-size:0.85rem;color:var(--text-muted)">6 dernières lignes</span>
        </div>
        <div class="panel-b panel-b--flush">
          <ul class="dash-log-list">${rows}</ul>
        </div>
      </div>`;
  }

  function wireDashActions(root) {
    root.querySelectorAll('[data-dash-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const page = btn.getAttribute('data-dash-page');
        if (!page || !global.InvooNavigation || typeof global.InvooNavigation.setActivePage !== 'function') return;
        global.InvooNavigation.setActivePage(page);
      });
    });
  }

  async function refreshDashboard() {
    const root = document.getElementById('page-dashboard');
    if (!root) return;

    const online = net.isOnline();
    const [stats, profileRaw, logsAll] = await Promise.all([
      db.getDashboardStats(),
      global.InvooSettings && typeof global.InvooSettings.getProfile === 'function'
        ? global.InvooSettings.getProfile()
        : db.getMeta('user_profile'),
      db.getAll(db.STORES.LOGS)
    ]);

    const logsSorted = Array.isArray(logsAll)
      ? logsAll.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 6)
      : [];

    const hints = buildContextualBanners(stats, online);

    const hintHtml = hints
      .map(
        (h) => `
      <div class="banner ${escapeHtml(h.cls)}" role="status">
        <div>
          <h3>${escapeHtml(h.title)}</h3>
          <p>${h.html}</p>
        </div>
      </div>`
      )
      .join('');

    root.innerHTML = `
      ${!online ? `<div class="banner info" role="status"><div><h3>Mode hors ligne</h3><p>Vous pouvez préparer listes, brouillon e-mail et files d’attente. L’envoi SMTP et le scan IMAP nécessitent une connexion.</p></div></div>` : ''}
      ${hintHtml}
      <div class="dash-intro">
        <p class="dash-kicker">Vue d’ensemble</p>
        <p class="dash-lead">Indicateurs et raccourcis pour votre flux <strong>local</strong> — listes, message, envoi, puis suivi. Les données restent sur cet appareil.</p>
      </div>
      ${renderProfilePanel(profileRaw)}
      ${renderQuickNav()}
      <div id="dash-stats-root"></div>
      ${renderLogsPanel(logsSorted)}
    `;

    const mount = document.getElementById('dash-stats-root');
    if (mount) renderStats(mount, stats);

    wireDashActions(root);
  }

  function dashboardVisible() {
    const p = document.getElementById('page-dashboard');
    return p && p.classList.contains('active');
  }

  function wireDashboardRefresh() {
    global.addEventListener('invooblast:page', (e) => {
      if (e.detail && e.detail.page === 'dashboard') refreshDashboard();
    });
    global.addEventListener('online', () => {
      if (dashboardVisible()) refreshDashboard();
    });
    global.addEventListener('offline', () => {
      if (dashboardVisible()) refreshDashboard();
    });
    [
      'invooblast:profile-updated',
      'invooblast:draft-updated',
      'invooblast:lists-updated',
      'invooblast:blast-settings-updated',
      'invooblast:send-finished'
    ].forEach((ev) => {
      global.addEventListener(ev, () => {
        if (dashboardVisible()) refreshDashboard();
      });
    });
  }

  global.InvooDashboard = { refreshDashboard, wireDashboardRefresh };
})(window);
