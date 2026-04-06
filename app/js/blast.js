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

  function mountBlast(root) {

    root.innerHTML = `

<div class="blast-page">

  <div class="panel">

    <div class="panel-h">

      <h2>Envoi (Blast)</h2>

      <span class="editor-hint" style="margin:0">Relais &amp; quotas · <strong>Paramètres</strong> · message &amp; profil · <strong>brouillon</strong></span>

    </div>

    <div class="panel-b">

      <p style="margin:0;color:var(--text-secondary);line-height:1.55">

        <strong>Outil d’envoi</strong> : listes et contacts sont locaux ; le <strong>message</strong> et le <strong>profil de fusion</strong> viennent du <strong>brouillon</strong> (éditeur), comme indiqué sous « Message source ». Le <strong>relais SMTP</strong>, les <strong>limites</strong> (quota, délai, ligne de départ) et le <strong>pool Gmail</strong> suivent <strong>Paramètres</strong> — résumés dans les blocs ci‑dessous.

        Données enregistrées <strong>dans ce navigateur uniquement</strong> (IndexedDB ; mots de passe Gmail chiffrés). Internet sert à joindre le relais et Gmail — aucune copie de vos données sur un serveur tiers.

      </p>

    </div>

  </div>



  <div class="panel">

    <div class="panel-h"><h2>Message source (brouillon)</h2></div>

    <div class="panel-b">

      <dl class="blast-dl">

        <dt>Objet</dt>

        <dd id="blast-draft-subject" class="blast-dd-mono">—</dd>

        <dt>Profil (fusion / CV)</dt>

        <dd id="blast-draft-profile">—</dd>

        <dt>Corps</dt>

        <dd>Brouillon de l’<strong>Éditeur e-mail</strong> (HTML + variables <code>{{…}}</code>). Enregistrez-le dans l’éditeur avant l’envoi.</dd>

      </dl>

      <p class="editor-hint" style="margin:0.75rem 0 0 0;line-height:1.5">À l’envoi, <code>{{prenom}}</code>, <code>{{nom}}</code>, etc. viennent du <strong>profil indiqué dans la ligne « Profil (fusion / CV) »</strong> (voir éditeur si ce n’est pas le profil actif Paramètres) et des <strong>colonnes de la liste</strong>. Une cellule vide dans la liste <strong>ne remplace pas</strong> une valeur déjà renseignée dans ce profil.</p>

    </div>

  </div>



  <div class="panel">

    <div class="panel-h"><h2>Configuration d’envoi (reprise Paramètres)</h2></div>

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

        <dt>Aléa sur le délai (max.)</dt>

        <dd id="blast-c-jitter">—</dd>

        <dt>Rotation du pool</dt>

        <dd id="blast-c-rotate">—</dd>

        <dt>Relais de secours</dt>

        <dd id="blast-c-relay">—</dd>

        <dt>Désactivation auto (erreur SMTP)</dt>

        <dd id="blast-c-err">—</dd>

        <dt>List-Unsubscribe (mailto)</dt>

        <dd id="blast-c-list-unsub">—</dd>

        <dt>Multipart texte brut</dt>

        <dd id="blast-c-plain">—</dd>

      </dl>

    </div>

  </div>



  <div class="panel">

    <div class="panel-h"><h2>Pool Gmail (comptes utilisés à l’envoi)</h2></div>

    <div class="panel-b">

      <div id="blast-pool-wrap"></div>

      <p class="row-actions" style="margin:0.75rem 0 0 0;flex-wrap:wrap;gap:0.75rem;align-items:center">

        <button type="button" class="btn" id="blast-pool-reset" title="Réactive tous les comptes et efface les erreurs enregistrées">Réinitialiser le pool</button>

        <span class="editor-hint" style="margin:0">Réactive les comptes désactivés et remet les compteurs d’erreur à zéro (identique à Paramètres → Pool Gmail).</span>

      </p>

      <p class="editor-hint" style="margin-top:0.75rem">Les mots de passe d’application ne sont jamais affichés ; ils sont chiffrés sur cet appareil.</p>

    </div>

  </div>



  <div class="panel">

    <div class="panel-h"><h2>Prêt à envoyer</h2></div>

    <div class="panel-b">

      <p id="blast-net-hint" style="margin:0 0 0.85rem 0;color:var(--text-secondary);line-height:1.5"></p>

      <p id="blast-ready-recap" class="editor-hint" style="margin:0 0 0.85rem 0;line-height:1.5"></p>

      <div id="blast-resume-banner" class="blast-resume-banner" hidden style="margin:0 0 0.85rem 0;padding:0.75rem 1rem;border-radius:var(--radius-md);background:var(--bg-elevated);border:1px solid var(--border)">

        <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:0.35rem">Reprise d’envoi</div>

        <p id="blast-resume-detail" class="editor-hint" style="margin:0 0 0.55rem 0;line-height:1.5"></p>

        <label class="settings-check" style="display:flex;align-items:flex-start;gap:0.5rem;margin:0 0 0.55rem 0;cursor:pointer;max-width:42rem">

          <input type="checkbox" id="blast-resume-use" />

          <span id="blast-resume-use-label">Reprendre à la ligne enregistrée (au lieu de la ligne de départ des Paramètres).</span>

        </label>

        <button type="button" class="btn" id="blast-resume-clear">Oublier cette reprise</button>

      </div>

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

    if (subjectEl && global.InvooEmailEditor) {

      try {

        const ed = global.InvooEmailEditor;

        let display = '';

        let draftSub = '';

        if (typeof ed.loadDraft === 'function') {

          const d = await ed.loadDraft();

          draftSub = d && d.subject != null ? String(d.subject).trim() : '';

        }

        if (typeof ed.getDraftAsTemplateRow === 'function') {

          const row = await ed.getDraftAsTemplateRow();

          display = row && row.subject != null ? String(row.subject).trim() : '';

        } else {

          display = draftSub;

        }

        subjectEl.textContent = display || '—';

        if (display && !draftSub) {

          subjectEl.textContent = `${display} (repli profil : objet défini dans Paramètres → Profil, brouillon sans objet)`;

        }

      } catch (_) {

        subjectEl.textContent = '—';

      }

    }

    const profileEl = root.querySelector('#blast-draft-profile');

    if (profileEl && settings) {

      try {

        function profLabel(p) {
          if (!p) return '—';
          if (p.profileLabel != null && String(p.profileLabel).trim()) return String(p.profileLabel).trim();
          const n = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
          return n || '—';
        }

        const draft =
          global.InvooEmailEditor && typeof global.InvooEmailEditor.loadDraft === 'function'
            ? await global.InvooEmailEditor.loadDraft()
            : {};
        const dpid =
          draft && draft.draftProfileId != null ? String(draft.draftProfileId).trim() : '';
        let fusionP = null;
        if (dpid && typeof settings.getProfileById === 'function') {
          fusionP = await settings.getProfileById(dpid);
        }
        const globalP = typeof settings.getProfile === 'function' ? await settings.getProfile() : null;
        if (!fusionP) fusionP = globalP;
        const resolvedId = fusionP && fusionP.id != null ? String(fusionP.id) : '';
        const dpidValid = !!(dpid && resolvedId === dpid);

        if (dpid && !dpidValid) {
          profileEl.textContent = `${profLabel(globalP)} (profil brouillon introuvable — repli défaut)`;
        } else if (dpidValid && globalP && String(fusionP.id) !== String(globalP.id)) {
          profileEl.textContent = `${profLabel(fusionP)} (brouillon · défaut app : ${profLabel(globalP)})`;
        } else if (dpidValid) {
          profileEl.textContent = `${profLabel(fusionP)} (brouillon)`;
        } else {
          profileEl.textContent = `${profLabel(globalP)} (défaut)`;
        }

      } catch (_) {

        profileEl.textContent = '—';

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

    const jit = Math.min(120, Math.max(0, Number(cfg.delayJitterSec) || 0));
    const delayBase = cfg.delaySec ?? 15;
    setText('#blast-c-delay', jit > 0 ? `${delayBase} s (+ jusqu’à ${jit} s au hasard)` : `${delayBase} s`);

    setText('#blast-c-jitter', jit > 0 ? `+ 0…${jit} s après chaque envoi` : 'Non');

    setText('#blast-c-rotate', `${cfg.rotationEvery ?? 50} e-mails par compte avant rotation`);

    setText('#blast-c-relay', yn(!!cfg.useFallbackRelay));

    setText('#blast-c-err', yn(cfg.disableOnError !== false));

    setText('#blast-c-list-unsub', yn(!!cfg.listUnsubscribeHeader));

    setText('#blast-c-plain', yn(!!cfg.plainTextAlternative));

    const readyRecap = root.querySelector('#blast-ready-recap');

    if (readyRecap) {

      const ru = escHtml(relayU);

      readyRecap.innerHTML = `Même réglages que <strong>Paramètres → Configuration envoi (Blast)</strong> : relais <span class="blast-dd-mono">${ru}</span>, ligne départ <strong>${cfg.startLine ?? 1}</strong>, quota <strong>${cfg.globalQuota ?? 500}</strong>, délai <strong>${cfg.delaySec ?? 15}</strong>&nbsp;s, rotation <strong>${cfg.rotationEvery ?? 50}</strong>. En cas d’échec sur une boîte, le même destinataire est <strong>réessayé avec les autres comptes actifs</strong> du pool (voir option désactivation auto dans Paramètres).`;

    }



    await populateListSelect(root);



    const wrap = root.querySelector('#blast-pool-wrap');

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

  <tbody>

    ${rows

      .map((r) => {

        const st = r.disabled

          ? '<span class="tag bad">Désactivé</span>'

          : '<span class="tag ok">Actif</span>';

        const fb = r.isFallback ? '<span class="tag info">Oui</span>' : '—';

        const err = r.failCount ? ` <span class="dim">(${r.failCount} err.)</span>` : '';

        const lastErr = r.lastError

          ? `<span class="dim" title="${escHtml(truncateText(r.lastError, 500))}">${escHtml(truncateText(r.lastError, 40))}</span>`

          : '—';

        const act = r.disabled

          ? `<button type="button" class="btn" data-blast-account="${escHtml(r.id)}" data-blast-action="enable" style="padding:0.25rem 0.55rem;font-size:0.88rem">Réactiver</button>`

          : `<button type="button" class="btn danger" data-blast-account="${escHtml(r.id)}" data-blast-action="disable" style="padding:0.25rem 0.55rem;font-size:0.88rem">Désactiver</button>`;

        return `<tr><td>${escHtml(r.email)}${err}</td><td>${st}</td><td>${fb}</td><td>${lastErr}</td><td>${act}</td></tr>`;

      })

      .join('')}

  </tbody>

</table>

</div>`;

      }

    } else if (wrap) {

      wrap.innerHTML =

        '<p class="editor-hint" style="margin:0">Pool Gmail indisponible (rechargez la page).</p>';

    }



    await renderBlastHistory(root);

    await updateBlastResumeUI(root);

    const netHint = root.querySelector('#blast-net-hint');

    if (netHint) {

      const online = net && net.isOnline();

      netHint.innerHTML = online

        ? 'Réseau <strong>en ligne</strong> : l’envoi passe par le relais local puis Gmail (SMTP).'

        : 'Mode <strong>hors ligne</strong> : connectez Internet pour envoyer.';

    }

  }

  function formatResumeTs(ts) {

    try {

      return new Date(ts).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

    } catch (_) {

      return '—';

    }

  }

  async function updateBlastResumeUI(root) {

    const wrap = root.querySelector('#blast-resume-banner');

    const detail = root.querySelector('#blast-resume-detail');

    const cb = root.querySelector('#blast-resume-use');

    const listSel = root.querySelector('#blast-list-id');

    if (!wrap || !db) return;

    let resume = null;

    const eng = global.InvooBlastSend;

    if (eng && typeof eng.getBlastResumeState === 'function') {

      resume = await eng.getBlastResumeState();

    } else {

      resume = await db.getMeta('blast_resume_v1', null);

    }

    if (!resume || typeof resume !== 'object' || !resume.listId || resume.nextLine1Based == null) {

      wrap.hidden = true;

      if (cb) {

        cb.checked = false;

        cb.removeAttribute('data-resume-line');

        cb.disabled = true;

      }

      return;

    }

    const lists = await db.getAll(db.STORES.LISTS);

    const listRow = lists.find((l) => l.id === resume.listId);

    const listName = listRow ? String(listRow.name || resume.listId) : 'Liste supprimée ou introuvable';

    const line = Math.max(1, Math.floor(Number(resume.nextLine1Based)) || 1);

    const lastEm = resume.lastProcessedEmail ? escHtml(String(resume.lastProcessedEmail)) : '—';

    const when = formatResumeTs(resume.ts);

    const selVal = listSel && listSel.value ? listSel.value : '';

    const match = selVal === resume.listId;

    wrap.hidden = false;

    if (detail) {

      detail.innerHTML = `Dernière position enregistrée pour la liste <strong>${escHtml(listName)}</strong> : reprendre à partir de la <strong>ligne ${line}</strong> (ordre alphabétique des e-mails valides, comme à l’envoi). Dernier destinataire traité : <span class="blast-dd-mono">${lastEm}</span> · ${escHtml(when)}`;

    }

    if (cb) {

      cb.setAttribute('data-resume-line', String(line));

      cb.disabled = !match;

      cb.checked = match;

    }

  }



  function wireBlastPage(root) {

    if (root.dataset.blastWired === '1') return;

    root.dataset.blastWired = '1';

    const btn = root.querySelector('#blast-btn-send');

    const statusEl = root.querySelector('#blast-send-status');

    const listSel = root.querySelector('#blast-list-id');

    const controlsRow = root.querySelector('#blast-send-controls');

    const btnPause = root.querySelector('#blast-btn-pause');

    const btnResume = root.querySelector('#blast-btn-resume');

    const btnAbort = root.querySelector('#blast-btn-abort');

    if (!btn) return;

    const blastSendDefaultLabel = (btn.textContent || '').trim() || 'Lancer l’envoi';

    function setBlastSendBusy(busy) {

      if (!btn) return;

      if (busy) {

        btn.textContent = 'Envoi en cours…';

        btn.classList.add('blast-send-busy');

        btn.setAttribute('aria-busy', 'true');

        btn.disabled = true;

      } else {

        btn.textContent = blastSendDefaultLabel;

        btn.classList.remove('blast-send-busy');

        btn.removeAttribute('aria-busy');

        btn.disabled = false;

      }

    }

    if (listSel) {

      listSel.addEventListener('change', () => updateBlastResumeUI(root).catch(console.error));

    }

    const btnResumeClear = root.querySelector('#blast-resume-clear');

    if (btnResumeClear) {

      btnResumeClear.addEventListener('click', async () => {

        const toast = global.InvooApp && global.InvooApp.showToast;

        try {

          const eng = global.InvooBlastSend;

          if (eng && typeof eng.clearBlastResume === 'function') await eng.clearBlastResume();

          else if (db) await db.del(db.STORES.META, 'blast_resume_v1');

          await updateBlastResumeUI(root);

          if (toast) toast('Mémoire de reprise effacée.', false);

        } catch (e) {

          if (toast) toast(e.message || String(e), true);

        }

      });

    }

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



    btn.addEventListener('click', async () => {

      const engine = global.InvooBlastSend;

      const toast = global.InvooApp && global.InvooApp.showToast;

      const listId = listSel && listSel.value;

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

      if (!ok) return;



      setBlastSendBusy(true);

      if (listSel) listSel.disabled = true;

      if (controlsRow) controlsRow.hidden = false;

      if (btnAbort) btnAbort.disabled = false;

      syncPauseButtons();

      if (statusEl) {

        statusEl.hidden = false;

        statusEl.textContent = 'Préparation…';

      }

      const liveLine = root.querySelector('#blast-live-line');

      if (liveLine) liveLine.textContent = 'Préparation…';



      try {

        const resumeCb = root.querySelector('#blast-resume-use');

        let useResume = false;

        let resumeFromLine1Based = null;

        if (resumeCb && resumeCb.checked && !resumeCb.disabled) {

          const ln = parseInt(resumeCb.getAttribute('data-resume-line') || '', 10);

          if (ln >= 1) {

            useResume = true;

            resumeFromLine1Based = ln;

          }

        }

        const result = await engine.runBlastSend({

          listId,

          useResume,

          resumeFromLine1Based,

          onProgress: (p) => {

            applyBlastProgressLive(root, p);

            if (!statusEl) return;

            if (p.phase === 'done') {

              statusEl.textContent = `Terminé : ${p.sent} envoyé(s), ${p.failed} échec(s) sur ${p.total}.`;

              return;

            }

            if (p.phase === 'aborted') {

              statusEl.textContent = `Interrompu : ${p.sent} envoyé(s), ${p.failed} échec(s) sur ${p.total}.`;

              return;

            }

            if (p.phase === 'sending') {

              statusEl.textContent = `Envoi ${p.index} / ${p.total} → ${p.lastTo || ''} (depuis ${p.from || ''})…`;

              return;

            }

            if (p.phase === 'error') {

              statusEl.textContent = `Erreur à ${p.index} / ${p.total} (${p.lastTo || ''}) — ${p.error || 'échec'}`;

            }

          }

        });

        if (toast) {

          if (result && result.aborted) {

            toast('Envoi interrompu. Voir le statut ci-dessous ou les journaux.');

          } else {

            toast('Campagne terminée. Voir le statut ci-dessous ou les journaux.');

          }

        }

        if (global.InvooDashboard && global.InvooDashboard.refreshDashboard) {

          global.InvooDashboard.refreshDashboard().catch(() => {});

        }

      } catch (e) {

        const msg = e && e.message ? String(e.message) : String(e);

        if (statusEl) {

          statusEl.hidden = false;

          statusEl.textContent = msg;

        }

        const liveErr = root.querySelector('#blast-live-line');

        if (liveErr) liveErr.textContent = `Erreur : ${msg}`;

        if (toast) toast(msg, true);

      } finally {

        setBlastSendBusy(false);

        if (listSel) listSel.disabled = false;

        if (controlsRow) controlsRow.hidden = true;

        if (btnPause) {

          btnPause.hidden = false;

          btnPause.disabled = false;

        }

        if (btnResume) btnResume.hidden = true;

        if (btnAbort) btnAbort.disabled = false;

        blastHistoryPage = 1;

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



  global.addEventListener('invooblast:profile-updated', () => {

    const root = document.getElementById('blast-root');

    if (root && root.dataset.mounted === '1') refreshBlastUI(root).catch(console.error);

  });



  global.addEventListener('invooblast:draft-updated', () => {

    const root = document.getElementById('blast-root');

    if (root && root.dataset.mounted === '1') refreshBlastUI(root).catch(console.error);

  });



  global.addEventListener('invooblast:lists-updated', () => {

    const root = document.getElementById('blast-root');

    if (root && root.dataset.mounted === '1') refreshBlastUI(root).catch(console.error);

  });

  global.addEventListener('invooblast:blast-resume-updated', () => {

    const root = document.getElementById('blast-root');

    if (root && root.dataset.mounted === '1') updateBlastResumeUI(root).catch(console.error);

  });



  global.InvooBlastPage = {

    init: initBlast,

    refresh: initBlast

  };

})(window);

