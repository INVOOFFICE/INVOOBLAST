/**
 * IMAP & bounces : scan des boîtes Gmail du pool (via relais Node) et marquage des contacts en erreur.
 */
(function (global) {
  'use strict';

  const db = global.InvooBlastDB;
  const net = global.InvooNetwork;
  const gmailStore = global.InvooGmailAccountStore;
  const relay = global.InvooSmtpRelayClient;
  const settings = global.InvooSettings;

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, isErr) {
    const app = global.InvooApp;
    if (app && app.showToast) app.showToast(msg, !!isErr);
    else if (isErr) console.error(msg);
    else console.info(msg);
  }

  function mountHtml(root) {
    root.innerHTML = `
<div class="imap-page">
  <div class="panel imap-intro-panel">
    <div class="panel-h"><h2>Analyser les rebonds (DSN)</h2></div>
    <div class="panel-b">
      <p class="editor-hint" style="margin-top:0">Le navigateur ne peut pas parler en IMAP directement. Chaque compte Gmail du <strong>pool</strong> est interrogé via votre <strong>relais local</strong> (même URL que pour l’envoi Blast — <code>POST /scan-bounces</code> sur le serveur Node dans <code>server/</code>).</p>
      <p class="editor-hint">Chaque compte est lu dans <strong>INBOX</strong> et <strong>Spam</strong> (rebonds souvent classés en spam). Les messages type « Delivery Status Notification », <code>X-Failed-Recipients</code>, etc. sont analysés ; les adresses en échec peuvent être <strong>marquées invalides</strong> dans vos listes.</p>
      <ul class="imap-req-list">
        <li>Relais Node démarré (<code>npm start</code> dans <code>server/</code>)</li>
        <li>Connexion Internet</li>
        <li>Compte(s) Gmail avec App Password dans Paramètres</li>
      </ul>
      <div class="row-actions imap-actions-top">
        <button type="button" class="btn primary" id="imap-scan-btn">Analyser les boîtes (une par une)</button>
      </div>
      <p id="imap-scan-status" class="imap-scan-status editor-hint" aria-live="polite"></p>
    </div>
  </div>
  <div class="panel imap-export-panel">
    <div class="panel-h"><h2>Base locale propre (export)</h2></div>
    <div class="panel-b">
      <p class="editor-hint" style="margin-top:0">Exportez vos <strong>listes</strong> et uniquement les contacts encore <strong>valides</strong> (non exclus rebond / invalide). Pour une copie complète (brouillon, historique, Gmail chiffré), utilisez <strong>Paramètres → Sauvegarde portable</strong>.</p>
      <p id="imap-clean-stats" class="editor-hint imap-clean-stats-line" aria-live="polite"></p>
      <div class="row-actions imap-export-actions">
        <button type="button" class="btn primary" id="imap-export-json">Télécharger JSON (listes + valides)</button>
        <button type="button" class="btn" id="imap-export-csv">Télécharger CSV (Excel)</button>
      </div>
    </div>
  </div>
  <div id="imap-results-wrap" class="imap-results-wrap" hidden>
    <div class="panel">
      <div class="panel-h"><h2>Résultat du scan</h2></div>
      <div class="panel-b">
        <div id="imap-per-account"></div>
        <p class="editor-label" style="margin-top:1rem">Adresses en échec vs base locale (IndexedDB)</p>
        <p class="editor-hint" style="margin-top:0.35rem">Chaque adresse extraite des rebonds est comparée à vos <strong>contacts</strong> : présence, listes, et statut <code>valide / invalide</code> déjà enregistré.</p>
        <div id="imap-email-list" class="imap-bounce-table-wrap"></div>
        <p id="imap-match-summary" class="editor-hint imap-match-summary-block"></p>
        <div class="row-actions">
          <button type="button" class="btn primary" id="imap-apply-btn" disabled>Marquer ces contacts comme invalides (listes)</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
  }

  /** @type {Set<string>|null} */
  let lastBounceEmails = null;

  function formatFolderDetail(folders) {
    if (!Array.isArray(folders) || !folders.length) return '';
    return folders
      .map((f) => {
        const p = escHtml(f.path || '—');
        if (f.skipped) {
          return `${p} : <span class="dim">${escHtml(f.reason || 'indisponible')}</span>`;
        }
        return `${p} : ${escHtml(String(f.messagesFetched ?? 0))} msg · ${escHtml(String(f.uidMatched ?? 0))} UID`;
      })
      .join(' · ');
  }

  function renderPerAccount(rows) {
    if (!rows.length) return '<p class="editor-hint">Aucun compte actif.</p>';
    const lines = rows
      .map((r) => {
        if (r.error) {
          return `<tr><td>${escHtml(r.email)}</td><td colspan="2"><span class="tag bad">${escHtml(r.error)}</span></td></tr>`;
        }
        const sub = formatFolderDetail(r.folders);
        const subRow = sub
          ? `<tr class="imap-folder-subrow"><td colspan="3"><span class="imap-folder-label">Dossiers</span> ${sub}</td></tr>`
          : '';
        return `<tr><td>${escHtml(r.email)}</td><td>${escHtml(String(r.messagesFetched ?? '—'))} msg analysé(s)</td><td>${escHtml(String(r.uidMatched ?? '—'))} UID</td></tr>${subRow}`;
      })
      .join('');
    return `<table class="settings-pool-table imap-per-table" role="grid">
  <thead><tr><th>Compte</th><th>Messages lus (total)</th><th>UID (total)</th></tr></thead>
  <tbody>${lines}</tbody>
</table>`;
  }

  function listNameById(lists, id) {
    const L = lists.find((l) => l.id === id);
    return L ? String(L.name || '') : '—';
  }

  /**
   * Croise les e-mails rebond avec tous les contacts.
   * @returns {{ rows: object[], stats: object }}
   */
  function analyzeBouncesAgainstDb(emailSet, allContacts, lists) {
    const norm = db.normalizeEmail;
    const emailsSorted = [...emailSet].sort((a, b) => a.localeCompare(b, 'fr'));
    let absent = 0;
    let validContactCount = 0;
    let invalidContactCount = 0;

    const rows = emailsSorted.map((email) => {
      const hits = allContacts.filter((c) => c && norm(c.email) === email);
      if (!hits.length) {
        absent++;
        return {
          email,
          kind: 'absent',
          detail: 'Aucune ligne dans vos listes',
          listNames: '—'
        };
      }
      const val = hits.filter((h) => h.valid !== false);
      const inv = hits.filter((h) => h.valid === false);
      validContactCount += val.length;
      invalidContactCount += inv.length;
      const names = [...new Set(hits.map((h) => listNameById(lists, h.listId)))].join(', ');
      let detail = '';
      if (val.length && inv.length) {
        detail = `${val.length} fiche(s) encore valide(s), ${inv.length} déjà invalide(s)`;
      } else if (val.length) {
        detail = `${val.length} fiche(s) encore valide(s)`;
      } else {
        detail = `${inv.length} fiche(s) déjà marquée(s) invalide(s)`;
      }
      return {
        email,
        kind: val.length ? 'actionable' : 'already',
        detail,
        listNames: names || '—'
      };
    });

    return {
      rows,
      stats: {
        bounceCount: emailsSorted.length,
        absent,
        present: emailsSorted.length - absent,
        validContactCount,
        invalidContactCount
      }
    };
  }

  function renderBounceTable(container, rows) {
    if (!rows.length) {
      container.innerHTML =
        '<p class="editor-hint">Aucune adresse en échec extraite. Vérifiez <strong>INBOX</strong> / <strong>Spam</strong> et la fenêtre des derniers jours côté relais.</p>';
      return;
    }
    const body = rows
      .map((r) => {
        const baseCell =
          r.kind === 'absent'
            ? '<span class="tag dim">Absente</span>'
            : r.kind === 'actionable'
              ? '<span class="tag bad">À traiter</span>'
              : '<span class="tag info">Déjà invalide</span>';
        return `<tr>
  <td class="imap-bounce-email">${escHtml(r.email)}</td>
  <td>${baseCell}</td>
  <td class="imap-bounce-detail">${escHtml(r.detail)}</td>
  <td class="imap-bounce-lists dim">${escHtml(r.listNames)}</td>
</tr>`;
      })
      .join('');
    container.innerHTML = `<div style="overflow-x:auto"><table class="settings-pool-table imap-bounce-db-table" role="grid">
  <thead><tr><th>E-mail rebond</th><th>Base locale</th><th>Détail</th><th>Listes</th></tr></thead>
  <tbody>${body}</tbody>
</table></div>`;
  }

  function renderBounceSummary(container, stats) {
    if (!stats || !stats.bounceCount) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = `Résumé : <strong>${stats.bounceCount}</strong> adresse(s) unique(s) détectée(s). 
<strong>${stats.present}</strong> trouvée(s) dans vos listes, <strong>${stats.absent}</strong> sans ligne locale (rebond hors base ou ancienne liste). 
Fiches encore <strong>valides</strong> (seront passées en invalide si vous appliquez) : <strong>${stats.validContactCount}</strong> · 
déjà <strong>invalides</strong> : <strong>${stats.invalidContactCount}</strong>.`;
  }

  function csvEscapeCell(s) {
    const t = String(s ?? '');
    if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
    return t;
  }

  async function refreshBounceSection(root) {
    const listEl = root.querySelector('#imap-email-list');
    const sumEl = root.querySelector('#imap-match-summary');
    const applyBtn = root.querySelector('#imap-apply-btn');
    if (!listEl || !lastBounceEmails || lastBounceEmails.size === 0) return null;
    const [all, lists] = await Promise.all([
      db.getAll(db.STORES.CONTACTS),
      db.getAll(db.STORES.LISTS)
    ]);
    const { rows, stats } = analyzeBouncesAgainstDb(lastBounceEmails, all, lists);
    renderBounceTable(listEl, rows);
    renderBounceSummary(sumEl, stats);
    if (applyBtn) applyBtn.disabled = stats.validContactCount === 0;
    return stats;
  }

  async function refreshCleanExportLine(root) {
    const el = root.querySelector('#imap-clean-stats');
    if (!el || typeof db.exportCleanListsPayload !== 'function') return;
    try {
      const p = await db.exportCleanListsPayload();
      const s = p.summary || {};
      el.textContent = `Actuellement : ${s.listCount ?? 0} liste(s), ${s.contactValid ?? 0} contact(s) valide(s), ${s.contactInvalid ?? 0} invalide(s) sur ${s.contactTotal ?? 0} au total.`;
    } catch (_) {
      el.textContent = '';
    }
  }

  function triggerDownload(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  async function downloadCleanJson() {
    if (typeof db.exportCleanListsPayload !== 'function') {
      toast('Export indisponible.', true);
      return;
    }
    const payload = await db.exportCleanListsPayload();
    const body = JSON.stringify(payload, null, 2);
    const blob = new Blob([body], { type: 'application/json;charset=utf-8' });
    const d = new Date();
    const pad = (x) => String(x).padStart(2, '0');
    const fname = `invooblast-clean-lists-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
    triggerDownload(blob, fname);
    toast('Export JSON téléchargé (listes + contacts valides).');
    await db.appendLog('info', 'Export base propre JSON (IMAP & bounces).', {
      valid: payload.summary && payload.summary.contactValid
    });
  }

  async function downloadCleanCsv() {
    if (typeof db.exportCleanListsPayload !== 'function') {
      toast('Export indisponible.', true);
      return;
    }
    const payload = await db.exportCleanListsPayload();
    const listMap = new Map((payload.lists || []).map((l) => [l.id, l.name]));
    const fieldKeys = new Set();
    for (const c of payload.contacts || []) {
      const f = c.fields && typeof c.fields === 'object' ? c.fields : {};
      Object.keys(f).forEach((k) => fieldKeys.add(k));
    }
    const extraCols = [...fieldKeys].sort((a, b) => a.localeCompare(b, 'fr'));
    const headers = ['liste', 'email', ...extraCols];
    const lines = [headers.map(csvEscapeCell).join(',')];
    for (const c of payload.contacts || []) {
      const f = c.fields && typeof c.fields === 'object' ? c.fields : {};
      const row = [
        listMap.get(c.listId) != null ? String(listMap.get(c.listId)) : '',
        String(c.email || c.emailNorm || ''),
        ...extraCols.map((k) => (f[k] != null ? String(f[k]) : ''))
      ];
      lines.push(row.map(csvEscapeCell).join(','));
    }
    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const d = new Date();
    const pad = (x) => String(x).padStart(2, '0');
    const fname = `invooblast-clean-contacts-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`;
    triggerDownload(blob, fname);
    toast('CSV téléchargé (contacts valides, UTF-8 pour Excel).');
    await db.appendLog('info', 'Export base propre CSV (IMAP & bounces).', {
      rows: (payload.contacts || []).length
    });
  }

  async function runScan(root) {
    const statusEl = root.querySelector('#imap-scan-status');
    const btn = root.querySelector('#imap-scan-btn');
    const wrap = root.querySelector('#imap-results-wrap');
    const perEl = root.querySelector('#imap-per-account');
    const applyBtn = root.querySelector('#imap-apply-btn');

    lastBounceEmails = null;
    if (applyBtn) applyBtn.disabled = true;
    if (wrap) wrap.hidden = true;

    if (!net.isOnline()) {
      toast('Connexion Internet requise pour le scan IMAP.', true);
      return;
    }
    if (!relay || typeof relay.relayScanBounces !== 'function') {
      toast('Client relais indisponible (rechargez la page).', true);
      return;
    }
    if (!settings || typeof settings.getBlastConfig !== 'function') {
      toast('Paramètres indisponibles.', true);
      return;
    }

    const cfg = await settings.getBlastConfig();
    const relayUrl = relay.normalizeBaseUrl(cfg.smtpRelayUrl);
    const apiKey = cfg.smtpRelayApiKey != null ? String(cfg.smtpRelayApiKey) : '';

    if (relay.mixedContentBlocksFetch && relay.mixedContentBlocksFetch(relayUrl)) {
      toast(
        'HTTPS + relais en http:// : le navigateur bloque l’appel. Utilisez l’app en localhost ou déployez le relais en HTTPS.',
        true
      );
      return;
    }

    const health = await relay.relayHealth(relayUrl, apiKey);
    if (!health.ok) {
      toast(health.message || 'Relais injoignable. Lancez le serveur dans server/ (npm start).', true);
      return;
    }
    const base = health.resolvedBase || relayUrl;

    const rows = await gmailStore.listAccounts();
    const active = rows.filter((r) => !r.disabled).sort((a, b) => String(a.email).localeCompare(b.email));
    if (!active.length) {
      toast('Aucun compte Gmail actif dans le pool (Paramètres).', true);
      return;
    }

    btn.disabled = true;
    statusEl.textContent = '';
    const merged = new Set();
    const perAccount = [];

    try {
      for (let i = 0; i < active.length; i++) {
        const acc = active[i];
        statusEl.textContent = `Compte ${i + 1} / ${active.length} : ${acc.email}…`;
        const auth = await gmailStore.getSmtpAuth(acc.id);
        if (!auth) {
          perAccount.push({ email: acc.email, error: 'Secret indisponible (coffre)' });
          continue;
        }
        try {
          const res = await relay.relayScanBounces(
            base,
            { auth, days: 30, maxMessages: 250 },
            apiKey
          );
          const list = Array.isArray(res.failedRecipients) ? res.failedRecipients : [];
          list.forEach((e) => {
            const n = db.normalizeEmail(e);
            if (n) merged.add(n);
          });
          perAccount.push({
            email: acc.email,
            uidMatched: res.uidMatched,
            messagesFetched: res.messagesFetched,
            folders: res.folders,
            count: list.length
          });
        } catch (e) {
          perAccount.push({
            email: acc.email,
            error: e && e.message ? String(e.message) : 'Erreur scan'
          });
        }
      }

      lastBounceEmails = merged;
      const emailsSorted = [...merged].sort((a, b) => a.localeCompare(b, 'fr'));

      perEl.innerHTML = renderPerAccount(perAccount);

      wrap.hidden = false;
      let stats = null;
      if (merged.size === 0) {
        const listEl = root.querySelector('#imap-email-list');
        const sumEl = root.querySelector('#imap-match-summary');
        if (listEl) renderBounceTable(listEl, []);
        if (sumEl) sumEl.innerHTML = '';
        if (applyBtn) applyBtn.disabled = true;
      } else {
        stats = await refreshBounceSection(root);
      }

      await db.appendLog('info', 'Scan IMAP rebonds terminé.', {
        accounts: active.length,
        bounceAddresses: emailsSorted.length,
        inDbAddresses: stats ? stats.present : 0,
        validFichesToMark: stats ? stats.validContactCount : 0
      });
    } finally {
      btn.disabled = false;
      statusEl.textContent = '';
    }
  }

  async function applyInvalid(root) {
    if (!lastBounceEmails || lastBounceEmails.size === 0) {
      toast('Lancez d’abord un scan.', true);
      return;
    }
    const dlg = global.InvooConfirm;
    const ok = dlg
      ? await dlg.show({
          title: 'Marquer comme invalides ?',
          message:
            'Les contacts dont l’e-mail correspond aux rebonds détectés seront exclus des prochains envois (champ valid).',
          confirmLabel: 'Marquer',
          cancelLabel: 'Annuler',
          danger: true
        })
      : global.confirm('Marquer ces contacts comme invalides ?');
    if (!ok) return;

    const norm = db.normalizeEmail;
    const all = await db.getAll(db.STORES.CONTACTS);
    let n = 0;
    for (const c of all) {
      if (!c || !lastBounceEmails.has(norm(c.email))) continue;
      await db.put(db.STORES.CONTACTS, {
        ...c,
        valid: false,
        bounceNotedAt: Date.now()
      });
      n++;
    }
    await db.appendLog('info', 'Contacts marqués invalides après scan rebonds IMAP.', { count: n });
    toast(`${n} contact(s) mis à jour.`);
    global.dispatchEvent(new CustomEvent('invooblast:lists-updated'));
    await refreshBounceSection(root);
    await refreshCleanExportLine(root);
  }

  function wire(root) {
    root.querySelector('#imap-scan-btn').addEventListener('click', () => runScan(root).catch((e) => toast(e.message || String(e), true)));
    root.querySelector('#imap-apply-btn').addEventListener('click', () => applyInvalid(root).catch((e) => toast(e.message || String(e), true)));
    const j = root.querySelector('#imap-export-json');
    const c = root.querySelector('#imap-export-csv');
    if (j) j.addEventListener('click', () => downloadCleanJson().catch((e) => toast(e.message || String(e), true)));
    if (c) c.addEventListener('click', () => downloadCleanCsv().catch((e) => toast(e.message || String(e), true)));
    global.addEventListener('invooblast:lists-updated', () => {
      refreshCleanExportLine(root).catch(() => {});
    });
    refreshCleanExportLine(root).catch(() => {});
  }

  function initImapPage() {
    const page = document.getElementById('page-imap');
    if (!page) return;
    let root = document.getElementById('imap-root');
    if (!root) {
      page.innerHTML = '<div id="imap-root"></div>';
      root = document.getElementById('imap-root');
    }
    if (page.dataset.imapMounted === '1') {
      refreshCleanExportLine(root).catch(() => {});
      return;
    }
    page.dataset.imapMounted = '1';
    mountHtml(root);
    wire(root);
  }

  global.addEventListener('invooblast:page', (e) => {
    if (e.detail && e.detail.page === 'imap') initImapPage();
  });

  global.InvooImapPage = { init: initImapPage };
})(window);
