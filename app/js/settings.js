/**
 * Page Paramètres : profil utilisateur, configuration Blast, pool Gmail.
 */
(function (global) {
  'use strict';

  const db = global.InvooBlastDB;
  const net = global.InvooNetwork;
  const gmailStore = global.InvooGmailAccountStore;

  const META_BLAST = 'blast_config';
  const META_PROFILE = 'user_profile';

  function notifyBlastSettingsUpdated() {
    global.dispatchEvent(new CustomEvent('invooblast:blast-settings-updated'));
  }

  const DEFAULT_BLAST = {
    startLine: 1,
    globalQuota: 500,
    delaySec: 15,
    rotationEvery: 50,
    disableOnError: true,
    useFallbackRelay: true,
    /** Relais Node local (voir server/smtp-relay.mjs). */
    smtpRelayUrl: 'http://127.0.0.1:18765',
    /** Si le relais déployé exige INVOOBLAST_RELAY_API_KEY côté serveur. */
    smtpRelayApiKey: ''
  };

  const DEFAULT_PROFILE = {
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: '',
    /** Ex. « marketing digital, développement web, gestion » — utilisé dans le modèle Candidature spontanée ({{domaine}}). */
    expertiseDomains: '',
    email: '',
    phone: '',
    addressLine: '',
    postalCode: '',
    city: '',
    country: '',
    website: '',
    /** Lien optionnel (PDF, LinkedIn…) — utile si vous ne collez pas de HTML dans cvHtml. */
    cvUrl: '',
    /** Fragment HTML du CV, fusionné dans l’e-mail via {{@cv_html}} (profil local, assaini à l’enregistrement). */
    cvHtml: ''
  };

  const APP_PWD_URL = 'https://support.google.com/mail/answer/185833?hl=fr';

  function toast(msg, isErr) {
    const app = global.InvooApp;
    if (app && app.showToast) app.showToast(msg, !!isErr);
    else if (isErr) console.error(msg);
    else console.info(msg);
  }

  function mountHtml(root) {
    root.innerHTML = `
<div class="settings-page">
  <section class="panel settings-block">
    <div class="panel-h"><h2>Profil utilisateur</h2>
      <button type="button" class="btn primary" id="st-profile-save">Enregistrer le profil</button>
    </div>
    <div class="panel-b settings-form-grid">
      <div class="settings-field">
        <label for="pf-first">Prénom</label>
        <input id="pf-first" type="text" class="editor-input" autocomplete="given-name"/>
      </div>
      <div class="settings-field">
        <label for="pf-last">Nom</label>
        <input id="pf-last" type="text" class="editor-input" autocomplete="family-name"/>
      </div>
      <div class="settings-field span-2">
        <label for="pf-company">Organisation / société</label>
        <input id="pf-company" type="text" class="editor-input" autocomplete="organization"/>
      </div>
      <div class="settings-field">
        <label for="pf-role">Fonction</label>
        <input id="pf-role" type="text" class="editor-input"/>
      </div>
      <div class="settings-field span-2">
        <label for="pf-domains">Domaines d’expérience (pour les modèles mail)</label>
        <input id="pf-domains" type="text" class="editor-input" placeholder="ex. marketing digital, développement web, gestion"/>
      </div>
      <div class="settings-field">
        <label for="pf-email">E-mail de contact</label>
        <input id="pf-email" type="email" class="editor-input" autocomplete="email"/>
      </div>
      <div class="settings-field">
        <label for="pf-phone">Téléphone</label>
        <input id="pf-phone" type="tel" class="editor-input" autocomplete="tel"/>
      </div>
      <div class="settings-field">
        <label for="pf-site">Site web</label>
        <input id="pf-site" type="url" class="editor-input" placeholder="https://"/>
      </div>
      <div class="settings-field span-2">
        <label for="pf-cv">Lien CV ou portfolio (optionnel)</label>
        <input id="pf-cv" type="url" class="editor-input" placeholder="https://…"/>
      </div>
      <div class="settings-field span-2">
        <label for="pf-cv-html">CV intégré au message (HTML)</label>
        <textarea id="pf-cv-html" class="editor-textarea" rows="12" spellcheck="false" placeholder="Collez ici le HTML de votre CV (tableaux et styles inline recommandés pour Gmail). Sera inséré dans le modèle à la place de {{@cv_html}} — le bouton « Voir mon CV » fait défiler jusqu’à ce bloc dans le même e-mail."></textarea>
        <p class="editor-hint" style="margin-top:8px">Pas de JavaScript. Les balises &lt;script&gt;, &lt;iframe&gt; et les attributs d’événements sont retirés à l’enregistrement.</p>
      </div>
      <div class="settings-field span-2">
        <label for="pf-address">Adresse</label>
        <input id="pf-address" type="text" class="editor-input" autocomplete="street-address"/>
      </div>
      <div class="settings-field">
        <label for="pf-zip">Code postal</label>
        <input id="pf-zip" type="text" class="editor-input"/>
      </div>
      <div class="settings-field">
        <label for="pf-city">Ville</label>
        <input id="pf-city" type="text" class="editor-input"/>
      </div>
      <div class="settings-field span-2">
        <label for="pf-country">Pays</label>
        <input id="pf-country" type="text" class="editor-input" autocomplete="country-name"/>
      </div>
    </div>
  </section>

  <section class="panel settings-block settings-backup-section">
    <div class="panel-h">
      <h2><span aria-hidden="true">💾</span> Sauvegarde &amp; restauration</h2>
    </div>
    <div class="panel-b settings-backup-body">
      <p class="settings-backup-lead">
        <strong>Stockage navigateur</strong> — données métier dans <strong>IndexedDB</strong> (voir <code>APP-GUIDE.txt</code>).
        <span id="st-backup-opfs-line" class="settings-backup-opfs-line"></span>
      </p>
      <p class="editor-hint settings-backup-hint">
        Stockage automatique dans ce navigateur. Pensez à <strong>exporter une sauvegarde JSON</strong> pour transférer vos données sur un autre appareil ou les archiver.
      </p>
      <p id="st-backup-quota" class="settings-backup-quota editor-hint" aria-live="polite">Estimation du quota…</p>

      <h3 class="settings-subh settings-backup-subh"><span aria-hidden="true">📦</span> Sauvegarde portable</h3>
      <p class="editor-hint">
        Exportez vos données en fichier JSON (listes, contacts, brouillon, config, comptes Gmail <em>chiffrés</em>, journaux).
        Importez un fichier produit par ce bouton — <strong>même format JSON</strong>.
      </p>
      <div class="row-actions settings-backup-actions">
        <button type="button" class="btn primary" id="st-backup-export">Exporter la sauvegarde (JSON)</button>
        <input type="file" id="st-backup-import-file" accept=".json,application/json" hidden />
        <button type="button" class="btn" id="st-backup-import-btn">Importer une sauvegarde</button>
      </div>
      <p class="editor-hint settings-backup-warning">
        Le fichier contient vos données et les <strong>clés locales de chiffrement</strong> (extraites du même navigateur à l’export). Gardez-le privé ; sans ces clés, les secrets Gmail de la sauvegarde ne sont pas utilisables sur un autre poste.
      </p>
    </div>
  </section>

  <section class="panel settings-block">
    <div class="panel-h">
      <h2>Configuration envoi (Blast)</h2>
      <div class="row-actions">
        <button type="button" class="btn" id="st-blast-verify" title="Vérifie que le relais Node répond sur l’URL configurée">Tester le relais SMTP</button>
        <button type="button" class="btn primary" id="st-blast-save">Enregistrer config</button>
      </div>
    </div>
    <div class="panel-b settings-form-grid">
      <div class="settings-field span-2 settings-toggle-row">
        <label class="settings-check">
          <input type="checkbox" id="bc-relay"/>
          <span>Relais de secours</span>
        </label>
        <span class="editor-hint">Utiliser le compte Gmail marqué « secours » si les comptes principaux sont indisponibles.</span>
      </div>
      <div class="settings-field span-2 settings-toggle-row">
        <label class="settings-check">
          <input type="checkbox" id="bc-disable-err"/>
          <span>Désactive le compte en erreur et passe au suivant</span>
        </label>
      </div>
      <div class="settings-field">
        <label for="bc-start">Ligne de départ</label>
        <input id="bc-start" type="number" min="1" step="1" class="editor-input"/>
      </div>
      <div class="settings-field">
        <label for="bc-quota">Quota global</label>
        <div class="settings-input-suffix">
          <input id="bc-quota" type="number" min="1" step="1" class="editor-input"/>
          <span class="suffix">e-mails</span>
        </div>
      </div>
      <div class="settings-field">
        <label for="bc-delay">Délai entre envois</label>
        <div class="settings-input-suffix">
          <input id="bc-delay" type="number" min="0" step="1" class="editor-input"/>
          <span class="suffix">s</span>
        </div>
      </div>
      <div class="settings-field">
        <label for="bc-rotate">Rotation pool</label>
        <div class="settings-input-suffix">
          <input id="bc-rotate" type="number" min="1" step="1" class="editor-input"/>
          <span class="suffix">e-mails / compte</span>
        </div>
      </div>
      <div class="settings-field span-2">
        <label for="bc-smtp-relay">URL du relais SMTP</label>
        <input id="bc-smtp-relay" type="url" class="editor-input" placeholder="http://127.0.0.1:18765 ou https://votre-relais.onrender.com" autocomplete="off"/>
        <span class="editor-hint">En local : <code>http://127.0.0.1:18765</code> + <code>npm start</code> dans <code>server/</code>. Sur GitHub Pages : déployez le relais en <strong>HTTPS</strong> ailleurs (Render, Fly.io…) et mettez son URL <code>https://…</code> ici — le port par défaut du script est <strong>18765</strong>.</span>
      </div>
      <div class="settings-field span-2">
        <label for="bc-relay-api-key">Clé API relais (optionnel)</label>
        <input id="bc-relay-api-key" type="password" class="editor-input" placeholder="Si INVOOBLAST_RELAY_API_KEY est défini sur le serveur" autocomplete="off"/>
        <span class="editor-hint">Laissez vide en local sans variable d’environnement. En production, même valeur que sur le serveur (voir <code>server/README.txt</code>).</span>
      </div>
      <p class="settings-footnote span-2">Ces paramètres sont lus par le moteur d’envoi Blast ; ils sont stockés uniquement sur cet appareil.</p>
    </div>
  </section>

  <section class="panel settings-block">
    <div class="panel-h">
      <h2>Pool Gmail</h2>
      <button type="button" class="btn" id="st-pool-reset">Reset</button>
    </div>
    <div class="panel-b">
      <p class="editor-hint" style="margin-bottom:0.75rem">Chaque ligne du pool utilise l’e-mail Gmail et le mot de passe d’application. Le bouton <strong>Contrôle local</strong> vérifie seulement le stockage et le format sur cet appareil — <strong>pas de connexion aux serveurs Google</strong>.</p>
      <div id="st-pool-list" class="settings-pool-list" aria-live="polite"></div>
      <div class="settings-pool-add">
        <h3 class="settings-subh">Ajouter un compte</h3>
        <div class="settings-form-grid">
          <div class="settings-field span-2">
            <label for="ga-email">E-mail Gmail</label>
            <input id="ga-email" type="email" class="editor-input" placeholder="email@gmail.com" autocomplete="off"/>
          </div>
          <div class="settings-field span-2">
            <label for="ga-pass">Mot de passe d’application</label>
            <input id="ga-pass" type="password" class="editor-input" placeholder="App Password (16 caractères)" autocomplete="off"/>
          </div>
          <div class="settings-field span-2 settings-toggle-row">
            <label class="settings-check">
              <input type="checkbox" id="ga-fallback"/>
              <span>Définir comme relais de secours</span>
            </label>
          </div>
          <div class="settings-field span-2 settings-help-row">
            <a href="${APP_PWD_URL}" target="_blank" rel="noopener noreferrer">Besoin d’aide ? Générer un App Password</a>
            <button type="button" class="btn primary" id="ga-add">Ajouter</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`;
  }

  function setInput(root, sel, val) {
    const el = root.querySelector(sel);
    if (el) el.value = val == null ? '' : String(val);
  }

  function getInputTrim(root, sel) {
    const el = root.querySelector(sel);
    return el ? String(el.value || '').trim() : '';
  }

  async function loadProfileIntoForm(root) {
    const p = { ...DEFAULT_PROFILE, ...(await db.getMeta(META_PROFILE)) };
    setInput(root, '#pf-first', p.firstName);
    setInput(root, '#pf-last', p.lastName);
    setInput(root, '#pf-company', p.company);
    setInput(root, '#pf-role', p.jobTitle);
    setInput(root, '#pf-domains', p.expertiseDomains);
    setInput(root, '#pf-email', p.email);
    setInput(root, '#pf-phone', p.phone);
    setInput(root, '#pf-site', p.website);
    setInput(root, '#pf-cv', p.cvUrl);
    setInput(root, '#pf-cv-html', p.cvHtml);
    setInput(root, '#pf-address', p.addressLine);
    setInput(root, '#pf-zip', p.postalCode);
    setInput(root, '#pf-city', p.city);
    setInput(root, '#pf-country', p.country);
  }

  function getTextareaRaw(root, sel) {
    const el = root.querySelector(sel);
    return el ? String(el.value || '') : '';
  }

  async function saveProfileFromForm(root) {
    const merge = global.InvooEmailMerge;
    const sanitize =
      merge && typeof merge.sanitizeCvHtml === 'function' ? merge.sanitizeCvHtml : (h) => String(h || '').trim();
    const p = {
      firstName: getInputTrim(root, '#pf-first'),
      lastName: getInputTrim(root, '#pf-last'),
      company: getInputTrim(root, '#pf-company'),
      jobTitle: getInputTrim(root, '#pf-role'),
      expertiseDomains: getInputTrim(root, '#pf-domains'),
      email: getInputTrim(root, '#pf-email'),
      phone: getInputTrim(root, '#pf-phone'),
      website: getInputTrim(root, '#pf-site'),
      cvUrl: getInputTrim(root, '#pf-cv'),
      cvHtml: sanitize(getTextareaRaw(root, '#pf-cv-html')),
      addressLine: getInputTrim(root, '#pf-address'),
      postalCode: getInputTrim(root, '#pf-zip'),
      city: getInputTrim(root, '#pf-city'),
      country: getInputTrim(root, '#pf-country'),
      updatedAt: Date.now()
    };
    await db.setMeta(META_PROFILE, p);
    await db.appendLog('info', 'Profil utilisateur enregistré.');
    toast('Profil enregistré localement.');
    global.dispatchEvent(new CustomEvent('invooblast:profile-updated'));
  }

  async function loadBlastIntoForm(root) {
    const c = { ...DEFAULT_BLAST, ...(await db.getMeta(META_BLAST)) };
    root.querySelector('#bc-relay').checked = !!c.useFallbackRelay;
    root.querySelector('#bc-disable-err').checked = c.disableOnError !== false;
    root.querySelector('#bc-start').value = String(c.startLine ?? 1);
    root.querySelector('#bc-quota').value = String(c.globalQuota ?? 500);
    root.querySelector('#bc-delay').value = String(c.delaySec ?? 15);
    root.querySelector('#bc-rotate').value = String(c.rotationEvery ?? 50);
    let relayShow = c.smtpRelayUrl ?? DEFAULT_BLAST.smtpRelayUrl;
    if (global.InvooSmtpRelayClient && typeof global.InvooSmtpRelayClient.normalizeBaseUrl === 'function') {
      relayShow = global.InvooSmtpRelayClient.normalizeBaseUrl(relayShow);
    }
    setInput(root, '#bc-smtp-relay', relayShow);
    setInput(root, '#bc-relay-api-key', c.smtpRelayApiKey ?? '');
  }

  async function saveBlastFromForm(root) {
    let relayUrl = getInputTrim(root, '#bc-smtp-relay');
    if (!relayUrl) relayUrl = DEFAULT_BLAST.smtpRelayUrl;
    try {
      const u = new URL(relayUrl);
      if (
        (u.hostname === '127.0.0.1' || u.hostname.toLowerCase() === 'localhost') &&
        u.port === '1876'
      ) {
        u.port = '18765';
        relayUrl = u.toString().replace(/\/+$/, '');
        toast('Le port a été corrigé en 18765 (et non 1876).');
      }
    } catch (_) {}
    const c = {
      startLine: Math.max(1, parseInt(root.querySelector('#bc-start').value, 10) || 1),
      globalQuota: Math.max(1, parseInt(root.querySelector('#bc-quota').value, 10) || 500),
      delaySec: Math.max(0, parseInt(root.querySelector('#bc-delay').value, 10) || 0),
      rotationEvery: Math.max(1, parseInt(root.querySelector('#bc-rotate').value, 10) || 50),
      disableOnError: root.querySelector('#bc-disable-err').checked,
      useFallbackRelay: root.querySelector('#bc-relay').checked,
      smtpRelayUrl: relayUrl,
      smtpRelayApiKey: getInputTrim(root, '#bc-relay-api-key'),
      updatedAt: Date.now()
    };
    await db.setMeta(META_BLAST, c);
    await db.appendLog('info', 'Configuration Blast enregistrée.', { config: c });
    toast('Configuration enregistrée.');
    notifyBlastSettingsUpdated();
  }

  async function renderPoolList(container) {
    const rows = await gmailStore.listAccounts();
    rows.sort((a, b) => String(a.email).localeCompare(b.email));
    if (!rows.length) {
      container.innerHTML = '<p class="editor-hint">Aucun compte dans le pool. Ajoutez un Gmail avec un mot de passe d’application (stocké chiffré sur cet appareil).</p>';
      return;
    }
    container.innerHTML = `
<table class="settings-pool-table" role="grid">
  <thead><tr><th>Compte</th><th>État</th><th>Secours</th><th class="settings-pool-actions-col">Actions</th></tr></thead>
  <tbody>
    ${rows
      .map(
        (r) => `
    <tr>
      <td>${escapeHtml(r.email)}${r.failCount ? ` <span class="dim">(${r.failCount} err.)</span>` : ''}</td>
      <td>${r.disabled ? '<span class="tag bad">Désactivé</span>' : '<span class="tag ok">Actif</span>'}</td>
      <td>${r.isFallback ? '<span class="tag info">Oui</span>' : '—'}</td>
      <td class="settings-pool-actions-cell">
        <button type="button" class="btn btn-small" data-verify="${escapeAttr(r.id)}" title="Contrôle local uniquement : coffre, déchiffrement, format App Password — aucune connexion à Google">Contrôle local</button>
        <button type="button" class="btn btn-small" data-remove="${escapeAttr(r.id)}">Retirer</button>
      </td>
    </tr>`
      )
      .join('')}
  </tbody>
</table>
<p class="editor-hint" style="margin-top:0.65rem"><strong>Contrôle local</strong> : vérifie sur cet appareil que le secret est lisible et ressemble à un App Password Gmail (16 caractères). <strong>Aucune requête n’est envoyée à Google</strong> ; seul un futur envoi SMTP depuis Blast pourra confirmer que le compte accepte vraiment la connexion.</p>`;
    container.querySelectorAll('[data-verify]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-verify');
        if (!id || typeof gmailStore.verifyAccount !== 'function') return;
        btn.disabled = true;
        try {
          const res = await gmailStore.verifyAccount(id);
          toast(res.message, !res.ok);
        } catch (e) {
          toast(e.message || String(e), true);
        } finally {
          btn.disabled = false;
        }
      });
    });
    container.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-remove');
        if (!id || !global.confirm('Retirer ce compte du pool ?')) return;
        await gmailStore.removeAccount(id);
        await db.appendLog('info', 'Compte retiré du pool Gmail.', { id });
        await renderPoolList(container);
        toast('Compte retiré.');
        notifyBlastSettingsUpdated();
        if (global.InvooDashboard && global.InvooDashboard.refreshDashboard)
          global.InvooDashboard.refreshDashboard().catch(() => {});
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  function formatBytes(n) {
    if (n == null || typeof n !== 'number' || !isFinite(n)) return '—';
    if (n < 1024) return `${Math.round(n)} o`;
    const units = ['Ko', 'Mo', 'Go', 'To'];
    let u = -1;
    let x = n;
    do {
      x /= 1024;
      u++;
    } while (x >= 1024 && u < units.length - 1);
    return `${x.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
  }

  /** Quota navigateur + détection API OPFS (voir APP-GUIDE : vérité métier = IndexedDB). */
  async function refreshBackupStorage(root) {
    const quotaEl = root.querySelector('#st-backup-quota');
    const opfsLine = root.querySelector('#st-backup-opfs-line');
    if (opfsLine) {
      let opfsOk = false;
      try {
        if (navigator.storage && typeof navigator.storage.getDirectory === 'function') {
          await navigator.storage.getDirectory();
          opfsOk = true;
        }
      } catch (_) {
        opfsOk = false;
      }
      opfsLine.innerHTML = opfsOk
        ? ' · <span class="tag ok">OPFS actif (origine privée)</span>'
        : ' · <span class="tag dim">OPFS non disponible ici</span>';
    }
    if (!quotaEl) return;
    if (!navigator.storage || !navigator.storage.estimate) {
      quotaEl.textContent = 'Quota : estimation non disponible dans ce contexte.';
      return;
    }
    try {
      const est = await navigator.storage.estimate();
      quotaEl.textContent = `Utilisé : ${formatBytes(est.usage)} · Quota disponible : ${formatBytes(est.quota)}`;
    } catch (_) {
      quotaEl.textContent = 'Impossible d’estimer le quota de stockage.';
    }
  }

  function wire(root) {
    root.querySelector('#st-profile-save').addEventListener('click', () =>
      saveProfileFromForm(root).catch((e) => toast(e.message || String(e), true))
    );

    root.querySelector('#st-blast-save').addEventListener('click', () =>
      saveBlastFromForm(root).catch((e) => toast(e.message || String(e), true))
    );

    root.querySelector('#st-blast-verify').addEventListener('click', async () => {
      if (!net.isOnline()) {
        toast('Test relais : connexion Internet requise pour joindre Gmail après le relais local.', true);
        return;
      }
      let relayUrl = getInputTrim(root, '#bc-smtp-relay');
      if (!relayUrl) relayUrl = DEFAULT_BLAST.smtpRelayUrl;
      const client = global.InvooSmtpRelayClient;
      if (!client || typeof client.relayHealth !== 'function') {
        toast('Client relais indisponible (rechargez la page).', true);
        return;
      }
      const apiKey = getInputTrim(root, '#bc-relay-api-key');
      try {
        const h = await client.relayHealth(relayUrl, apiKey);
        toast(h.ok ? `Relais OK (${relayUrl})` : h.message, !h.ok);
      } catch (e) {
        toast(e.message || String(e), true);
      }
    });

    root.querySelector('#st-pool-reset').addEventListener('click', async () => {
      if (!global.confirm('Réinitialiser l’état du pool (réactiver les comptes, effacer les compteurs d’erreur) ?')) return;
      const n = await gmailStore.resetPoolHealth();
      await renderPoolList(root.querySelector('#st-pool-list'));
      toast(`Pool réinitialisé (${n} compte(s)).`);
      notifyBlastSettingsUpdated();
      if (global.InvooDashboard && global.InvooDashboard.refreshDashboard)
        global.InvooDashboard.refreshDashboard().catch(() => {});
    });

    root.querySelector('#ga-add').addEventListener('click', async () => {
      try {
        const email = root.querySelector('#ga-email').value.trim().toLowerCase();
        const appPassword = root.querySelector('#ga-pass').value;
        const isFb = root.querySelector('#ga-fallback').checked;
        await gmailStore.saveAccount({ email, appPassword, isFallback: isFb });
        root.querySelector('#ga-pass').value = '';
        await renderPoolList(root.querySelector('#st-pool-list'));
        toast('Compte Gmail enregistré (secret chiffré).');
        notifyBlastSettingsUpdated();
        if (global.InvooDashboard && global.InvooDashboard.refreshDashboard)
          global.InvooDashboard.refreshDashboard().catch(() => {});
      } catch (e) {
        toast(e.message || String(e), true);
      }
    });

    const backupExport = root.querySelector('#st-backup-export');
    const backupImportBtn = root.querySelector('#st-backup-import-btn');
    const backupImportFile = root.querySelector('#st-backup-import-file');
    if (backupExport) {
      backupExport.addEventListener('click', async () => {
        try {
          if (typeof db.exportBackup !== 'function') {
            toast('Export indisponible (base de données non chargée).', true);
            return;
          }
          const payload = await db.exportBackup();
          const body = JSON.stringify(payload);
          const blob = new Blob([body], { type: 'application/json;charset=utf-8' });
          const a = document.createElement('a');
          const d = new Date();
          const pad = (x) => String(x).padStart(2, '0');
          const fname = `invooblast-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
          a.href = URL.createObjectURL(blob);
          a.download = fname;
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(a.href);
          toast('Sauvegarde exportée (JSON).');
          await db.appendLog('info', 'Export sauvegarde portable JSON.', { bytes: body.length });
          refreshBackupStorage(root).catch(() => {});
        } catch (e) {
          toast(e.message || String(e), true);
        }
      });
    }
    if (backupImportBtn && backupImportFile) {
      backupImportBtn.addEventListener('click', () => backupImportFile.click());
      backupImportFile.addEventListener('change', async () => {
        const f = backupImportFile.files && backupImportFile.files[0];
        backupImportFile.value = '';
        if (!f) return;
        if (
          !global.confirm(
            'Remplacer toutes les données locales INVOOBLAST par cette sauvegarde ? Action irréversible sans une autre copie de secours.'
          )
        ) {
          return;
        }
        try {
          const text = await f.text();
          await db.importBackupFromJsonText(text);
          toast('Sauvegarde importée. Les données affichées viennent du fichier.');
          global.dispatchEvent(new CustomEvent('invooblast:lists-updated'));
          global.dispatchEvent(new CustomEvent('invooblast:profile-updated'));
          global.dispatchEvent(new CustomEvent('invooblast:draft-updated'));
          notifyBlastSettingsUpdated();
          await refreshAll(root);
          if (global.InvooDashboard && global.InvooDashboard.refreshDashboard) {
            global.InvooDashboard.refreshDashboard().catch(() => {});
          }
        } catch (e) {
          toast(e.message || String(e), true);
        }
      });
    }

    refreshBackupStorage(root).catch(() => {});
  }

  async function refreshAll(root) {
    await loadProfileIntoForm(root);
    await loadBlastIntoForm(root);
    await renderPoolList(root.querySelector('#st-pool-list'));
    await refreshBackupStorage(root);
  }

  function initSettings() {
    const page = document.getElementById('page-settings');
    if (!page) return;
    if (page.dataset.settingsMounted === '1') {
      refreshAll(page.firstElementChild).catch(console.error);
      return;
    }
    page.innerHTML = '<div id="settings-root"></div>';
    const root = document.getElementById('settings-root');
    mountHtml(root);
    page.dataset.settingsMounted = '1';
    wire(root);
    refreshAll(root).catch(console.error);
  }

  global.addEventListener('invooblast:page', (e) => {
    if (e.detail && e.detail.page === 'settings') initSettings();
  });

  global.InvooSettings = {
    init: initSettings,
    getBlastConfig: () =>
      db.getMeta(META_BLAST).then((c) => ({ ...DEFAULT_BLAST, ...(c && typeof c === 'object' ? c : {}) })),
    getProfile: () => db.getMeta(META_PROFILE).then((p) => ({ ...DEFAULT_PROFILE, ...p }))
  };
})(window);
