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

  <tbody>

    ${rows

      .map((r) => {

        const st = r.disabled

          ? '<span class="tag bad">Désactivé</span>'

          : '<span class="tag ok">Actif</span>';

        const fb = r.isFallback ? '<span class="tag info">Oui</span>' : '—';

        const err = r.failCount ? ` <span class="dim">(${r.failCount} err.)</span>` : '';

        return `<tr><td>${escHtml(r.email)}${err}</td><td>${st}</td><td>${fb}</td></tr>`;

      })

      .join('')}

  </tbody>

</table>`;

    }



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

    if (!btn) return;



    btn.addEventListener('click', async () => {

      const engine = global.InvooBlastSend;

      const toast = global.InvooApp && global.InvooApp.showToast;

      const listId = root.querySelector('#blast-list-id') && root.querySelector('#blast-list-id').value;

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



      const ok = global.confirm(

        `Envoyer jusqu’à ${totalValid} message(s) vers la liste sélectionnée ? Les comptes Gmail du pool seront utilisés selon la rotation configurée.`

      );

      if (!ok) return;



      btn.disabled = true;

      if (statusEl) {

        statusEl.hidden = false;

        statusEl.textContent = 'Préparation…';

      }



      try {

        await engine.runBlastSend({

          listId,

          onProgress: (p) => {

            if (!statusEl) return;

            if (p.phase === 'done') {

              statusEl.textContent = `Terminé : ${p.sent} envoyé(s), ${p.failed} échec(s) sur ${p.total}.`;

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

        if (toast) toast('Campagne terminée. Voir le statut ci-dessous ou les journaux.');

        if (global.InvooDashboard && global.InvooDashboard.refreshDashboard) {

          global.InvooDashboard.refreshDashboard().catch(() => {});

        }

      } catch (e) {

        const msg = e && e.message ? String(e.message) : String(e);

        if (statusEl) {

          statusEl.hidden = false;

          statusEl.textContent = msg;

        }

        if (toast) toast(msg, true);

      } finally {

        btn.disabled = false;

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

