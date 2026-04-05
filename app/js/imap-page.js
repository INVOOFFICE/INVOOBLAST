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
  <div id="imap-results-wrap" class="imap-results-wrap" hidden>
    <div class="panel">
      <div class="panel-h"><h2>Résultat du scan</h2></div>
      <div class="panel-b">
        <div id="imap-per-account"></div>
        <p class="editor-label" style="margin-top:1rem">Adresses en échec détectées (toutes boîtes confondues)</p>
        <div id="imap-email-list" class="imap-email-list"></div>
        <p id="imap-match-summary" class="editor-hint"></p>
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

  function renderEmailChips(container, emails) {
    if (!emails.length) {
      container.innerHTML =
        '<p class="editor-hint">Aucune adresse en échec extraite. Vérifiez que les rebonds sont dans <strong>INBOX</strong> ou <strong>Spam</strong> (fenêtre des derniers jours selon le relais).</p>';
      return;
    }
    container.innerHTML = emails
      .map((e) => `<span class="imap-bounce-chip">${escHtml(e)}</span>`)
      .join('');
  }

  function matchContacts(emailSet) {
    const contacts = db.getAll(db.STORES.CONTACTS);
    return contacts.then((all) => {
      const norm = db.normalizeEmail;
      return all.filter((c) => c && emailSet.has(norm(c.email)));
    });
  }

  async function runScan(root) {
    const statusEl = root.querySelector('#imap-scan-status');
    const btn = root.querySelector('#imap-scan-btn');
    const wrap = root.querySelector('#imap-results-wrap');
    const perEl = root.querySelector('#imap-per-account');
    const listEl = root.querySelector('#imap-email-list');
    const sumEl = root.querySelector('#imap-match-summary');
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
      const emailsSorted = [...merged].sort((a, b) => a.localeCompare(b));

      perEl.innerHTML = renderPerAccount(perAccount);
      renderEmailChips(listEl, emailsSorted);

      const matched = await matchContacts(merged);
      sumEl.innerHTML = `Correspondance listes locales : <strong>${matched.length}</strong> contact(s) sur ${emailsSorted.length} adresse(s) détectée(s). Les envois Blast ignorent déjà les contacts <code>valid: false</code>.`;

      wrap.hidden = false;
      applyBtn.disabled = matched.length === 0;

      await db.appendLog('info', 'Scan IMAP rebonds terminé.', {
        accounts: active.length,
        bounceAddresses: emailsSorted.length,
        matchedContacts: matched.length
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
    const applyBtn = root.querySelector('#imap-apply-btn');
    if (applyBtn) applyBtn.disabled = true;
  }

  function wire(root) {
    root.querySelector('#imap-scan-btn').addEventListener('click', () => runScan(root).catch((e) => toast(e.message || String(e), true)));
    root.querySelector('#imap-apply-btn').addEventListener('click', () => applyInvalid(root).catch((e) => toast(e.message || String(e), true)));
  }

  function initImapPage() {
    const page = document.getElementById('page-imap');
    if (!page) return;
    let root = document.getElementById('imap-root');
    if (!root) {
      page.innerHTML = '<div id="imap-root"></div>';
      root = document.getElementById('imap-root');
    }
    if (page.dataset.imapMounted === '1') return;
    page.dataset.imapMounted = '1';
    mountHtml(root);
    wire(root);
  }

  global.addEventListener('invooblast:page', (e) => {
    if (e.detail && e.detail.page === 'imap') initImapPage();
  });

  global.InvooImapPage = { init: initImapPage };
})(window);
