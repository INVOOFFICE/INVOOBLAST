/**

 * Page Envoi (Blast) : config, pool Gmail, choix de liste, lancement du moteur via relais SMTP local.

 */

(function (global) {

  'use strict';



  const db = global.InvooBlastDB;

  const settings = global.InvooSettings;

  const gmailStore = global.InvooGmailAccountStore;

  const net = global.InvooNetwork;



  function escHtml(s) {

    return String(s)

      .replace(/&/g, '&amp;')

      .replace(/</g, '&lt;')

      .replace(/>/g, '&gt;')

      .replace(/"/g, '&quot;');

  }



  function yn(b) {

    return b ? 'Oui' : 'Non';

  }



<<<<<<< HEAD
=======
  const HISTORY_PAGE_SIZE = 12;

  let blastHistoryPage = 1;

  function truncateText(s, max) {

    const t = String(s || '');

    if (t.length <= max) return t;

    return `${t.slice(0, Math.max(0, max - 1))}…`;

  }

  function formatHistoryTs(ts) {

    try {

      return new Date(ts).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' });

    } catch (_) {

      return '—';

    }

  }

  /** Met à jour la ligne « En direct » pendant / après une campagne. */

  function applyBlastProgressLive(root, p) {

    const el = root.querySelector('#blast-live-line');

    if (!el || !p) return;

    if (p.phase === 'sending') {

      el.textContent = `Envoi ${p.index} / ${p.total} → ${p.lastTo || '—'} (compte ${p.from || '—'})`;

      return;

    }

    if (p.phase === 'error') {

      el.textContent = `Échec ${p.index} / ${p.total} → ${p.lastTo || '—'} — ${p.error || 'erreur'}`;

      return;

    }

    if (p.phase === 'done') {

      el.textContent = `Terminé : ${p.sent} envoyé(s), ${p.failed} échec(s) sur ${p.total}.`;

      return;

    }

    if (p.phase === 'aborted') {

      el.textContent = `Interrompu : ${p.sent} envoyé(s), ${p.failed} échec(s) sur ${p.total}.`;

    }

  }

  async function renderBlastHistory(root) {

    const wrap = root.querySelector('#blast-history-table-wrap');

    const pager = root.querySelector('#blast-history-pager');

    const prev = root.querySelector('#blast-history-prev');

    const next = root.querySelector('#blast-history-next');

    const info = root.querySelector('#blast-history-pageinfo');

    if (!wrap || !db || !db.STORES) return;

    let rows = [];

    try {

      rows = await db.getAll(db.STORES.SEND_HISTORY);

    } catch (_) {

      rows = [];

    }

    rows.sort((a, b) => (b.ts || 0) - (a.ts || 0));

    const total = rows.length;

    const pageSize = HISTORY_PAGE_SIZE;

    const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);

    if (blastHistoryPage > pageCount) blastHistoryPage = pageCount;

    if (blastHistoryPage < 1) blastHistoryPage = 1;

    const start = (blastHistoryPage - 1) * pageSize;

    const slice = rows.slice(start, start + pageSize);

    if (total === 0) {

      wrap.innerHTML =

        '<p class="editor-hint" style="margin:0">Aucun envoi enregistré pour l’instant. Lancez une campagne ci‑dessus.</p>';

      if (pager) pager.hidden = true;

      return;

    }

    wrap.innerHTML = `

<div style="overflow-x:auto">

<table class="settings-pool-table blast-history-table" role="grid">

  <thead><tr><th>Date</th><th>Destinataire</th><th>Statut</th><th>Compte</th><th>Objet</th></tr></thead>

  <tbody>

    ${slice

      .map((r) => {

        const st =

          r.status === 'sent'

            ? '<span class="tag ok">Envoyé</span>'

            : '<span class="tag bad">Échec</span>';

        const subj = truncateText(r.subject || '—', 48);

        const titleFull = escHtml(r.subject || '');

        return `<tr>

        <td>${escHtml(formatHistoryTs(r.ts))}</td>

        <td>${escHtml(r.to || '—')}</td>

        <td>${st}</td>

        <td>${escHtml(r.from || '—')}</td>

        <td title="${titleFull}">${escHtml(subj)}</td>

      </tr>`;

      })

      .join('')}

  </tbody>

</table>

</div>`;

    if (pager && info && prev && next) {

      pager.hidden = pageCount <= 1;

      info.textContent = `Page ${blastHistoryPage} / ${pageCount} · ${total} envoi(s)`;

      prev.disabled = blastHistoryPage <= 1;

      next.disabled = blastHistoryPage >= pageCount;

    }

  }

>>>>>>> 7f4f399 (ok)
  function mountBlast(root) {

    root.innerHTML = `

<div class="blast-page">

  <div class="panel">

    <div class="panel-h">

      <h2>Envoi (Blast)</h2>

      <span class="editor-hint" style="margin:0">Données alignées sur <strong>Paramètres</strong></span>

    </div>

    <div class="panel-b">

      <p style="margin:0;color:var(--text-secondary);line-height:1.55">

        <strong>Outil d’envoi</strong> : listes, contacts, brouillon, profil et pool Gmail sont enregistrés <strong>dans ce navigateur uniquement</strong> (IndexedDB ; mots de passe Gmail chiffrés).

        Internet sert ici seulement à <strong>tester le relais</strong> et à <strong>envoyer les e-mails</strong> via l’URL SMTP configurée en Paramètres — aucune copie de vos données sur un serveur tiers.

      </p>

    </div>

  </div>



  <div class="panel">

    <div class="panel-h"><h2>Message source (brouillon)</h2></div>

    <div class="panel-b">

      <dl class="blast-dl">

        <dt>Objet</dt>

        <dd id="blast-draft-subject" class="blast-dd-mono">—</dd>

        <dt>Corps</dt>

        <dd>Brouillon de l’<strong>Éditeur e-mail</strong> (HTML + variables <code>{{…}}</code>). Enregistrez-le dans l’éditeur avant l’envoi.</dd>

      </dl>

    </div>

  </div>



  <div class="panel">

    <div class="panel-h"><h2>Configuration d’envoi</h2></div>

    <div class="panel-b">

      <dl class="blast-dl" id="blast-config-dl">

        <dt>Relais SMTP local</dt>

        <dd id="blast-c-relay-url" class="blast-dd-mono">—</dd>

        <dt>Ligne de départ (liste)</dt>

        <dd id="blast-c-start">—</dd>

        <dt>Quota global</dt>

        <dd id="blast-c-quota">—</dd>

        <dt>Délai entre envois</dt>

        <dd id="blast-c-delay">—</dd>

        <dt>Rotation du pool</dt>

        <dd id="blast-c-rotate">—</dd>

        <dt>Relais de secours</dt>

        <dd id="blast-c-relay">—</dd>

        <dt>Désactiver le compte en erreur</dt>

        <dd id="blast-c-err">—</dd>

      </dl>

    </div>

  </div>



  <div class="panel">

    <div class="panel-h"><h2>Pool Gmail (comptes utilisés à l’envoi)</h2></div>

    <div class="panel-b">

      <div id="blast-pool-wrap"></div>

<<<<<<< HEAD
=======
      <p class="row-actions" style="margin:0.75rem 0 0 0;flex-wrap:wrap;gap:0.75rem;align-items:center">

        <button type="button" class="btn" id="blast-pool-reset" title="Réactive tous les comptes et efface les erreurs enregistrées">Réinitialiser le pool</button>

        <span class="editor-hint" style="margin:0">Réactive les comptes désactivés et remet les compteurs d’erreur à zéro (identique à Paramètres → Pool Gmail).</span>

      </p>

>>>>>>> 7f4f399 (ok)
      <p class="editor-hint" style="margin-top:0.75rem">Les mots de passe d’application ne sont jamais affichés ; ils sont chiffrés sur cet appareil.</p>

    </div>

  </div>



  <div class="panel">

    <div class="panel-h"><h2>Prêt à envoyer</h2></div>

    <div class="panel-b">

      <p id="blast-net-hint" style="margin:0 0 0.85rem 0;color:var(--text-secondary);line-height:1.5"></p>

      <div class="settings-field span-2" style="margin-bottom:0.85rem">

        <label for="blast-list-id">Liste destinataires</label>

        <select id="blast-list-id" class="editor-input" style="max-width:min(100%,420px)">

          <option value="">— Choisir une liste —</option>

        </select>

      </div>

      <p id="blast-send-status" class="editor-hint" style="margin:0 0 0.85rem 0" hidden></p>

      <p class="row-actions" style="margin:0">

        <button type="button" class="btn primary" id="blast-btn-send" title="Envoie via le relais local et le pool Gmail (Paramètres)">Lancer l’envoi</button>

        <span class="editor-hint" style="margin:0;align-self:center">Relais Node requis sur l’URL indiquée ci‑dessus.</span>

      </p>

<<<<<<< HEAD
=======
      <p class="row-actions blast-send-controls" id="blast-send-controls" style="margin:0.75rem 0 0 0;flex-wrap:wrap;gap:0.5rem" hidden>

        <button type="button" class="btn" id="blast-btn-pause">Pause</button>

        <button type="button" class="btn primary" id="blast-btn-resume" hidden>Reprendre</button>

        <button type="button" class="btn danger" id="blast-btn-abort">Arrêter l’envoi</button>

      </p>

    </div>

  </div>



  <div class="panel">

    <div class="panel-h"><h2>Historique d’envoi</h2></div>

    <div class="panel-b">

      <div id="blast-live-wrap" style="margin:0 0 1rem 0;padding:0.75rem 1rem;border-radius:var(--radius-md);background:var(--bg-elevated);border:1px solid var(--border)">

        <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:0.4rem">En direct</div>

        <div id="blast-live-line" class="blast-dd-mono" style="margin:0;min-height:1.35em;word-break:break-word">— Aucun envoi en cours</div>

      </div>

      <div id="blast-history-table-wrap"></div>

      <p class="row-actions" id="blast-history-pager" style="margin:0.75rem 0 0 0;flex-wrap:wrap;gap:0.75rem;align-items:center" hidden>

        <button type="button" class="btn" id="blast-history-prev">Précédent</button>

        <span id="blast-history-pageinfo" class="editor-hint" style="margin:0"></span>

        <button type="button" class="btn" id="blast-history-next">Suivant</button>

      </p>

>>>>>>> 7f4f399 (ok)
    </div>

  </div>

</div>`;

  }



  async function populateListSelect(root) {

    const sel = root.querySelector('#blast-list-id');

    if (!sel || !db || !db.STORES) return;

    const prev = sel.value;

    const lists = await db.getAll(db.STORES.LISTS);

    lists.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fr'));

    let opts = '<option value="">— Choisir une liste —</option>';

    for (const l of lists) {

      const id = escHtml(l.id);

      const name = escHtml(l.name || l.id);

      opts += `<option value="${id}">${name}</option>`;

    }

    sel.innerHTML = opts;

    if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;

  }



  async function refreshBlastUI(root) {

    if (!root) return;

    const cfg = settings && settings.getBlastConfig ? await settings.getBlastConfig() : {};

    const subjectEl = root.querySelector('#blast-draft-subject');

    if (subjectEl && global.InvooEmailEditor && typeof global.InvooEmailEditor.loadDraft === 'function') {

      try {

        const d = await global.InvooEmailEditor.loadDraft();

        const sub = (d && d.subject != null && String(d.subject).trim()) || '—';

        subjectEl.textContent = sub === '—' ? '—' : sub;

      } catch (_) {

        subjectEl.textContent = '—';

      }

    }



    const setText = (id, text) => {

      const el = root.querySelector(id);

      if (el) el.textContent = text;

    };

    const relayU = String(cfg.smtpRelayUrl || 'http://127.0.0.1:18765').trim() || '—';
    setText('#blast-c-relay-url', relayU);

    setText('#blast-c-start', String(cfg.startLine ?? 1));

    setText('#blast-c-quota', `${cfg.globalQuota ?? 500} e-mails max.`);

    setText('#blast-c-delay', `${cfg.delaySec ?? 15} s`);

    setText('#blast-c-rotate', `${cfg.rotationEvery ?? 50} e-mails par compte avant rotation`);

    setText('#blast-c-relay', yn(!!cfg.useFallbackRelay));

    setText('#blast-c-err', yn(cfg.disableOnError !== false));



    await populateListSelect(root);



    const wrap = root.querySelector('#blast-pool-wrap');

<<<<<<< HEAD
    if (!wrap || !gmailStore || typeof gmailStore.listAccounts !== 'function') return;

    let rows = await gmailStore.listAccounts();

    rows = [...rows].sort((a, b) => String(a.email).localeCompare(b.email, 'fr'));

    if (!rows.length) {

      wrap.innerHTML =

        '<p class="editor-hint" style="margin:0">Aucun compte Gmail dans le pool. Ajoutez-en dans <strong>Paramètres → Pool Gmail</strong>.</p>';

    } else {

      wrap.innerHTML = `

<table class="settings-pool-table blast-pool-readonly" role="grid">

  <thead><tr><th>Compte</th><th>État</th><th>Secours</th></tr></thead>
=======
    if (wrap && gmailStore && typeof gmailStore.listAccounts === 'function') {

      let rows = await gmailStore.listAccounts();

      rows = [...rows].sort((a, b) => String(a.email).localeCompare(b.email, 'fr'));

      if (!rows.length) {

        wrap.innerHTML =

          '<p class="editor-hint" style="margin:0">Aucun compte Gmail dans le pool. Ajoutez-en dans <strong>Paramètres → Pool Gmail</strong>.</p>';

      } else {

        wrap.innerHTML = `

<div style="overflow-x:auto">

<table class="settings-pool-table blast-pool-table" role="grid">

  <thead><tr><th>Compte</th><th>État</th><th>Secours</th><th>Dernière erreur</th><th>Actions</th></tr></thead>
>>>>>>> 7f4f399 (ok)

  <tbody>

    ${rows

      .map((r) => {

        const st = r.disabled

          ? '<span class="tag bad">Désactivé</span>'

          : '<span class="tag ok">Actif</span>';

        const fb = r.isFallback ? '<span class="tag info">Oui</span>' : '—';

        const err = r.failCount ? ` <span class="dim">(${r.failCount} err.)</span>` : '';

<<<<<<< HEAD
        return `<tr><td>${escHtml(r.email)}${err}</td><td>${st}</td><td>${fb}</td></tr>`;
=======
        const lastErr = r.lastError

          ? `<span class="dim" title="${escHtml(truncateText(r.lastError, 500))}">${escHtml(truncateText(r.lastError, 40))}</span>`

          : '—';

        const act = r.disabled

          ? `<button type="button" class="btn" data-blast-account="${escHtml(r.id)}" data-blast-action="enable" style="padding:0.25rem 0.55rem;font-size:0.88rem">Réactiver</button>`

          : `<button type="button" class="btn danger" data-blast-account="${escHtml(r.id)}" data-blast-action="disable" style="padding:0.25rem 0.55rem;font-size:0.88rem">Désactiver</button>`;

        return `<tr><td>${escHtml(r.email)}${err}</td><td>${st}</td><td>${fb}</td><td>${lastErr}</td><td>${act}</td></tr>`;
>>>>>>> 7f4f399 (ok)

      })

      .join('')}

  </tbody>

<<<<<<< HEAD
</table>`;
=======
</table>

</div>`;

      }

    } else if (wrap) {

      wrap.innerHTML =

        '<p class="editor-hint" style="margin:0">Pool Gmail indisponible (rechargez la page).</p>';
>>>>>>> 7f4f399 (ok)

    }



<<<<<<< HEAD
=======
    await renderBlastHistory(root);



>>>>>>> 7f4f399 (ok)
    const netHint = root.querySelector('#blast-net-hint');

    if (netHint) {

      const online = net && net.isOnline();

      netHint.innerHTML = online

        ? 'Réseau <strong>en ligne</strong> : l’envoi passe par le relais local puis Gmail (SMTP).'

        : 'Mode <strong>hors ligne</strong> : connectez Internet pour envoyer.';

    }

  }



  function wireBlastPage(root) {

    if (root.dataset.blastWired === '1') return;

    root.dataset.blastWired = '1';

    const btn = root.querySelector('#blast-btn-send');

    const statusEl = root.querySelector('#blast-send-status');

<<<<<<< HEAD
=======
    const listSel = root.querySelector('#blast-list-id');

    const controlsRow = root.querySelector('#blast-send-controls');

    const btnPause = root.querySelector('#blast-btn-pause');

    const btnResume = root.querySelector('#blast-btn-resume');

    const btnAbort = root.querySelector('#blast-btn-abort');

>>>>>>> 7f4f399 (ok)
    if (!btn) return;



<<<<<<< HEAD
=======
    const histPrev = root.querySelector('#blast-history-prev');

    const histNext = root.querySelector('#blast-history-next');

    if (histPrev) {

      histPrev.addEventListener('click', () => {

        if (blastHistoryPage > 1) {

          blastHistoryPage--;

          renderBlastHistory(root).catch(console.error);

        }

      });

    }

    if (histNext) {

      histNext.addEventListener('click', () => {

        blastHistoryPage++;

        renderBlastHistory(root).catch(console.error);

      });

    }



    const btnPoolReset = root.querySelector('#blast-pool-reset');

    if (btnPoolReset) {

      btnPoolReset.addEventListener('click', async () => {

        const toast = global.InvooApp && global.InvooApp.showToast;

        if (!gmailStore || typeof gmailStore.resetPoolHealth !== 'function') {

          if (toast) toast('Pool Gmail indisponible (rechargez la page).', true);

          return;

        }

        const dlg = global.InvooConfirm;

        const ok = dlg

          ? await dlg.show({

              title: 'Réinitialiser le pool ?',

              message:

                'Réinitialiser l’état du pool (réactiver les comptes, effacer les compteurs d’erreur) ?',

              confirmLabel: 'Réinitialiser',

              cancelLabel: 'Annuler'

            })

          : global.confirm(

              'Réinitialiser l’état du pool (réactiver les comptes, effacer les compteurs d’erreur) ?'

            );

        if (!ok) return;

        try {

          const n = await gmailStore.resetPoolHealth();

          if (toast) toast(`Pool réinitialisé (${n} compte(s)).`);

          global.dispatchEvent(new CustomEvent('invooblast:blast-settings-updated'));

          if (global.InvooDashboard && global.InvooDashboard.refreshDashboard) {

            global.InvooDashboard.refreshDashboard().catch(() => {});

          }

        } catch (e) {

          const msg = e && e.message ? String(e.message) : String(e);

          if (toast) toast(msg, true);

        }

      });

    }



    root.addEventListener('click', async (ev) => {

      const t = ev.target;

      const btnPool = t && t.closest && t.closest('[data-blast-action][data-blast-account]');

      if (!btnPool || !root.contains(btnPool)) return;

      const id = btnPool.getAttribute('data-blast-account');

      const action = btnPool.getAttribute('data-blast-action');

      if (!id || !gmailStore || typeof gmailStore.setAccountDisabled !== 'function') return;

      ev.preventDefault();

      const toast = global.InvooApp && global.InvooApp.showToast;

      try {

        if (action === 'disable') {

          const dlg = global.InvooConfirm;

          const ok = dlg

            ? await dlg.show({

                title: 'Désactiver ce compte ?',

                message:

                  'Il ne sera plus utilisé pour l’envoi Blast tant que vous ne le réactivez pas (ici ou dans Paramètres).',

                confirmLabel: 'Désactiver',

                cancelLabel: 'Annuler',

                danger: true

              })

            : global.confirm('Désactiver ce compte pour l’envoi ?');

          if (!ok) return;

          await gmailStore.setAccountDisabled(id, true);

          if (toast) toast('Compte désactivé pour l’envoi.');

        } else if (action === 'enable') {

          await gmailStore.setAccountDisabled(id, false);

          if (toast) toast('Compte réactivé.');

        } else {

          return;

        }

        global.dispatchEvent(new CustomEvent('invooblast:blast-settings-updated'));

      } catch (err) {

        const msg = err && err.message ? String(err.message) : String(err);

        if (toast) toast(msg, true);

      }

    });



    function syncPauseButtons() {

      const eng = global.InvooBlastSend;

      const paused = eng && typeof eng.isSendPaused === 'function' && eng.isSendPaused();

      if (btnPause) {

        btnPause.hidden = !!paused;

        btnPause.disabled = false;

      }

      if (btnResume) {

        btnResume.hidden = !paused;

        btnResume.disabled = false;

      }

    }



    if (btnPause) {

      btnPause.addEventListener('click', () => {

        const eng = global.InvooBlastSend;

        if (!eng || typeof eng.pauseSend !== 'function') return;

        eng.pauseSend();

        if (statusEl) statusEl.textContent = 'En pause…';

        syncPauseButtons();

      });

    }



    if (btnResume) {

      btnResume.addEventListener('click', () => {

        const eng = global.InvooBlastSend;

        if (!eng || typeof eng.resumeSend !== 'function') return;

        eng.resumeSend();

        syncPauseButtons();

      });

    }



    if (btnAbort) {

      btnAbort.addEventListener('click', async () => {

        const eng = global.InvooBlastSend;

        if (!eng || typeof eng.abortSend !== 'function') return;

        const dlg = global.InvooConfirm;

        const ok = dlg

          ? await dlg.show({

              title: 'Arrêter l’envoi ?',

              message:

                'Les messages déjà envoyés le restent ; le reste de la campagne ne sera pas traité.',

              confirmLabel: 'Arrêter',

              cancelLabel: 'Continuer'

            })

          : global.confirm('Arrêter l’envoi ? Les messages déjà envoyés le restent.');

        if (ok) eng.abortSend();

      });

    }



>>>>>>> 7f4f399 (ok)
    btn.addEventListener('click', async () => {

      const engine = global.InvooBlastSend;

      const toast = global.InvooApp && global.InvooApp.showToast;

<<<<<<< HEAD
      const listId = root.querySelector('#blast-list-id') && root.querySelector('#blast-list-id').value;
=======
      const listId = listSel && listSel.value;
>>>>>>> 7f4f399 (ok)

      if (!listId) {

        if (toast) toast('Choisissez une liste de destinataires.', true);

        return;

      }

      if (!engine || typeof engine.runBlastSend !== 'function') {

        if (toast) toast('Moteur d’envoi indisponible (rechargez la page).', true);

        return;

      }

      if (!net || !net.isOnline()) {

        if (toast) toast('Connexion Internet requise pour envoyer.', true);

        return;

      }



      let totalValid = 0;

      try {

        const cfg = await settings.getBlastConfig();

        const allC = await db.getAll(db.STORES.CONTACTS);

        const startIdx = Math.max(0, (Number(cfg.startLine) || 1) - 1);

        const valid = allC.filter((c) => c.listId === listId && c.valid !== false);

        const afterStart = valid.slice(startIdx);

        const quota = Math.max(1, Number(cfg.globalQuota) || 500);

        totalValid = Math.min(quota, afterStart.length);

      } catch (_) {

        totalValid = 0;

      }



      if (totalValid < 1) {

        if (toast)

          toast(

            'Aucun e-mail à envoyer pour cette liste (ligne de départ / quota / contacts valides). Vérifiez Paramètres et l’import liste.',

            true

          );

        return;

      }



<<<<<<< HEAD
      const ok = global.confirm(

        `Envoyer jusqu’à ${totalValid} message(s) vers la liste sélectionnée ? Les comptes Gmail du pool seront utilisés selon la rotation configurée.`

      );
=======
      const dlg = global.InvooConfirm;

      const ok = dlg
        ? await dlg.show({
            title: 'Lancer l’envoi ?',
            message: `Envoyer jusqu’à ${totalValid} message(s) vers la liste sélectionnée ? Les comptes Gmail du pool seront utilisés selon la rotation configurée.`,
            confirmLabel: 'Envoyer',
            cancelLabel: 'Annuler'
          })
        : global.confirm(
            `Envoyer jusqu’à ${totalValid} message(s) vers la liste sélectionnée ? Les comptes Gmail du pool seront utilisés selon la rotation configurée.`
          );
>>>>>>> 7f4f399 (ok)

      if (!ok) return;



      btn.disabled = true;

<<<<<<< HEAD
=======
      if (listSel) listSel.disabled = true;

      if (controlsRow) controlsRow.hidden = false;

      if (btnAbort) btnAbort.disabled = false;

      syncPauseButtons();

>>>>>>> 7f4f399 (ok)
      if (statusEl) {

        statusEl.hidden = false;

        statusEl.textContent = 'Préparation…';

      }

<<<<<<< HEAD
=======
      const liveLine = root.querySelector('#blast-live-line');

      if (liveLine) liveLine.textContent = 'Préparation…';

>>>>>>> 7f4f399 (ok)


      try {

<<<<<<< HEAD
        await engine.runBlastSend({
=======
        const result = await engine.runBlastSend({
>>>>>>> 7f4f399 (ok)

          listId,

          onProgress: (p) => {

<<<<<<< HEAD
=======
            applyBlastProgressLive(root, p);

>>>>>>> 7f4f399 (ok)
            if (!statusEl) return;

            if (p.phase === 'done') {

              statusEl.textContent = `Terminé : ${p.sent} envoyé(s), ${p.failed} échec(s) sur ${p.total}.`;

              return;

            }

<<<<<<< HEAD
=======
            if (p.phase === 'aborted') {

              statusEl.textContent = `Interrompu : ${p.sent} envoyé(s), ${p.failed} échec(s) sur ${p.total}.`;

              return;

            }

>>>>>>> 7f4f399 (ok)
            if (p.phase === 'sending') {

              statusEl.textContent = `Envoi ${p.index} / ${p.total} → ${p.lastTo || ''} (depuis ${p.from || ''})…`;

              return;

            }

            if (p.phase === 'error') {

              statusEl.textContent = `Erreur à ${p.index} / ${p.total} (${p.lastTo || ''}) — ${p.error || 'échec'}`;

            }

          }

        });

<<<<<<< HEAD
        if (toast) toast('Campagne terminée. Voir le statut ci-dessous ou les journaux.');
=======
        if (toast) {

          if (result && result.aborted) {

            toast('Envoi interrompu. Voir le statut ci-dessous ou les journaux.');

          } else {

            toast('Campagne terminée. Voir le statut ci-dessous ou les journaux.');

          }

        }
>>>>>>> 7f4f399 (ok)

        if (global.InvooDashboard && global.InvooDashboard.refreshDashboard) {

          global.InvooDashboard.refreshDashboard().catch(() => {});

        }

      } catch (e) {

        const msg = e && e.message ? String(e.message) : String(e);

        if (statusEl) {

          statusEl.hidden = false;

          statusEl.textContent = msg;

        }

<<<<<<< HEAD
=======
        const liveErr = root.querySelector('#blast-live-line');

        if (liveErr) liveErr.textContent = `Erreur : ${msg}`;

>>>>>>> 7f4f399 (ok)
        if (toast) toast(msg, true);

      } finally {

        btn.disabled = false;

<<<<<<< HEAD
=======
        if (listSel) listSel.disabled = false;

        if (controlsRow) controlsRow.hidden = true;

        if (btnPause) {

          btnPause.hidden = false;

          btnPause.disabled = false;

        }

        if (btnResume) btnResume.hidden = true;

        if (btnAbort) btnAbort.disabled = false;

        blastHistoryPage = 1;

>>>>>>> 7f4f399 (ok)
        await refreshBlastUI(root);

      }

    });

  }



  function initBlast() {

    const page = document.getElementById('page-blast');

    if (!page) return;

    let root = page.querySelector('#blast-root');

    if (!root) {

      page.innerHTML = '<div id="blast-root"></div>';

      root = page.querySelector('#blast-root');

    }

    if (root.dataset.mounted !== '1') {

      mountBlast(root);

      wireBlastPage(root);

      root.dataset.mounted = '1';

    }

    refreshBlastUI(root).catch(console.error);

  }



  global.addEventListener('invooblast:page', (e) => {

    if (e.detail && e.detail.page === 'blast') initBlast();

  });



  global.addEventListener('invooblast:blast-settings-updated', () => {

    const root = document.getElementById('blast-root');

    if (root && root.dataset.mounted === '1') refreshBlastUI(root).catch(console.error);

  });



  global.addEventListener('invooblast:draft-updated', () => {

    const root = document.getElementById('blast-root');

    if (root && root.dataset.mounted === '1') refreshBlastUI(root).catch(console.error);

  });



  global.addEventListener('invooblast:lists-updated', () => {

    const root = document.getElementById('blast-root');

    if (root && root.dataset.mounted === '1') populateListSelect(root);

  });



  global.InvooBlastPage = {

    init: initBlast,

    refresh: initBlast

  };

})(window);

