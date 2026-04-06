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
  /** Plusieurs profils : { version, activeProfileId, profiles[] } — migré depuis META_PROFILE seul. */
  const META_PROFILES = 'user_profiles';

  function notifyBlastSettingsUpdated() {
    global.dispatchEvent(new CustomEvent('invooblast:blast-settings-updated'));
  }

  const DEFAULT_BLAST = {
    startLine: 1,
    globalQuota: 500,
    delaySec: 15,
    /** Secondes ajoutées au hasard (0…n) après le délai fixe, entre chaque envoi — cadence moins prévisible. */
    delayJitterSec: 0,
    rotationEvery: 50,
    disableOnError: true,
    useFallbackRelay: true,
    /** Relais Node : en-tête List-Unsubscribe (mailto = compte qui envoie). */
    listUnsubscribeHeader: false,
    /** Relais Node : multipart text/plain dérivé du HTML (meilleure compatibilité). */
    plainTextAlternative: false,
    /** `local` = relais Node + Gmail ; `cloud` = Worker HTTPS (Resend côté Worker). */
    sendingMode: 'local',
    /** URL de base du Worker (ex. https://xxx.workers.dev), sans /send. */
    cloudWorkerUrl: '',
    /** Relais Node local (voir server/smtp-relay.mjs). */
    smtpRelayUrl: 'http://127.0.0.1:18765',
    /** Si le relais déployé exige INVOOBLAST_RELAY_API_KEY côté serveur. */
    smtpRelayApiKey: ''
  };

  const DEFAULT_PROFILE = {
    /** Nom affiché dans le menu des profils */
    profileLabel: 'Profil 1',
    firstName: '',
    lastName: '',
    jobTitle: '',
    /** Ex. « marketing digital, développement web, gestion » — utilisé dans le modèle Candidature spontanée ({{domaine}}). */
    expertiseDomains: '',
    email: '',
    /** Objet suggéré si le brouillon n’a pas d’objet ; repli Blast */
    emailSubject: '',
    /** Reply-To suggéré si le brouillon n’en a pas */
    emailReplyTo: '',
    phone: '',
    addressLine: '',
    postalCode: '',
    city: '',
    country: '',
    website: '',
    /** Lien optionnel (PDF, LinkedIn…) — utile si vous ne collez pas de HTML dans cvHtml. */
    cvUrl: '',
    /** Fragment HTML du CV actif (doublon du bloc sélectionné — compat. anciennes sauvegardes). */
    cvHtml: '',
    /** @type {{ id: string, label: string, html: string }[]} */
    cvHtmlVariants: [],
    /** Id du bloc utilisé pour {{@cv_html}} (aperçu + envoi Blast). */
    selectedCvHtmlId: '',
    /** Langue des modèles Stage / Travail / Volontariat dans l’éditeur quand ce profil est celui du brouillon : 'fr' | 'en' */
    preferredTemplateLang: 'fr'
  };

  const APP_PWD_URL = 'https://support.google.com/mail/answer/185833?hl=fr';

  function normalizePreferredTemplateLang(v) {
    return String(v || '').toLowerCase() === 'en' ? 'en' : 'fr';
  }

  /** Normalise le profil : plusieurs CV HTML + id sélectionné pour la fusion. */
  function migrateProfileCv(raw) {
    const base = { ...DEFAULT_PROFILE, ...(raw && typeof raw === 'object' ? raw : {}) };
    let variants = Array.isArray(base.cvHtmlVariants) ? base.cvHtmlVariants.slice() : [];
    const legacyHtml = base.cvHtml != null ? String(base.cvHtml) : '';
    if (!variants.length) {
      variants = [{ id: 'cv-1', label: 'CV principal', html: legacyHtml }];
    }
    const used = new Set();
    variants = variants.map((v, i) => {
      let id = v && v.id != null ? String(v.id).trim() : '';
      if (!id || used.has(id)) {
        id = `cv-${i + 1}`;
        while (used.has(id)) id = `${id}a`;
      }
      used.add(id);
      const label =
        v && v.label != null && String(v.label).trim() ? String(v.label).trim() : `CV ${i + 1}`;
      const html = v && v.html != null ? String(v.html) : '';
      return { id, label, html };
    });
    let sel = base.selectedCvHtmlId != null ? String(base.selectedCvHtmlId).trim() : '';
    if (!sel || !variants.some((v) => v.id === sel)) sel = variants[0].id;
    const activeHtml = (variants.find((v) => v.id === sel) || variants[0]).html;
    return {
      ...base,
      preferredTemplateLang: normalizePreferredTemplateLang(base.preferredTemplateLang),
      cvHtmlVariants: variants,
      selectedCvHtmlId: sel,
      cvHtml: activeHtml
    };
  }

  /** Profil prêt pour stockage / fusion : sans champ société (rempli par les contacts importés si besoin). */
  function normalizeStoredProfile(raw) {
    const o = raw && typeof raw === 'object' ? { ...raw } : {};
    delete o.company;
    const m = migrateProfileCv({ ...DEFAULT_PROFILE, ...o });
    delete m.company;
    return m;
  }

  function sanitizeProfilesBundle(b) {
    const rawList = Array.isArray(b.profiles) ? b.profiles : [];
    const profiles = rawList.map((p) => {
      const id =
        p && p.id != null && String(p.id).trim() ? String(p.id).trim() : db.uuid();
      return normalizeStoredProfile({ ...p, id });
    });
    if (!profiles.length) {
      const id = db.uuid();
      profiles.push(normalizeStoredProfile({ id, profileLabel: 'Profil 1' }));
    }
    let activeProfileId = b.activeProfileId != null ? String(b.activeProfileId).trim() : '';
    if (!activeProfileId || !profiles.some((p) => p.id === activeProfileId)) {
      activeProfileId = profiles[0].id;
    }
    return { version: 1, activeProfileId, profiles };
  }

  async function syncActiveProfileLegacy(bundle) {
    const clean = sanitizeProfilesBundle(bundle);
    const p = clean.profiles.find((x) => x.id === clean.activeProfileId) || clean.profiles[0];
    await db.setMeta(META_PROFILE, normalizeStoredProfile(p));
  }

  async function loadProfilesBundle() {
    const raw = await db.getMeta(META_PROFILES);
    if (raw && typeof raw === 'object' && Array.isArray(raw.profiles) && raw.profiles.length) {
      return sanitizeProfilesBundle(raw);
    }
    const legacy = await db.getMeta(META_PROFILE);
    if (legacy && typeof legacy === 'object' && !Array.isArray(legacy.profiles)) {
      const id = db.uuid();
      const lab =
        [legacy.firstName, legacy.lastName].filter(Boolean).join(' ').trim() || 'Profil principal';
      const merged = normalizeStoredProfile({
        ...legacy,
        id,
        profileLabel:
          legacy.profileLabel != null && String(legacy.profileLabel).trim()
            ? String(legacy.profileLabel).trim()
            : lab
      });
      const bundle = sanitizeProfilesBundle({ version: 1, activeProfileId: id, profiles: [merged] });
      await db.setMeta(META_PROFILES, bundle);
      await syncActiveProfileLegacy(bundle);
      return bundle;
    }
    const id = db.uuid();
    const bundle = sanitizeProfilesBundle({
      version: 1,
      activeProfileId: id,
      profiles: [normalizeStoredProfile({ id, profileLabel: 'Profil 1' })]
    });
    await db.setMeta(META_PROFILES, bundle);
    await syncActiveProfileLegacy(bundle);
    return bundle;
  }

  async function persistProfilesBundle(bundle) {
    const clean = sanitizeProfilesBundle(bundle);
    await db.setMeta(META_PROFILES, clean);
    await syncActiveProfileLegacy(clean);
    return clean;
  }

  let cvVariantsState = [];
  let cvEditId = '';

  function syncCvFormToState(root) {
    if (!cvEditId || !cvVariantsState.length) return;
    const v = cvVariantsState.find((x) => x.id === cvEditId);
    if (!v) return;
    v.label = getInputTrim(root, '#pf-cv-label') || v.label;
    v.html = getTextareaRaw(root, '#pf-cv-html');
  }

  function loadCvVariantIntoForm(root) {
    const v = cvVariantsState.find((x) => x.id === cvEditId);
    if (!v) return;
    setInput(root, '#pf-cv-label', v.label);
    setInput(root, '#pf-cv-html', v.html);
  }

  function fillCvSelects(root) {
    const active = root.querySelector('#pf-cv-active');
    const edit = root.querySelector('#pf-cv-edit');
    const prevActive = active && active.value;
    const opts = cvVariantsState
      .map((v) => `<option value="${escapeAttr(v.id)}">${escapeHtml(v.label)}</option>`)
      .join('');
    if (active) {
      active.innerHTML = opts;
      const aVal =
        prevActive && cvVariantsState.some((x) => x.id === prevActive)
          ? prevActive
          : cvVariantsState[0]?.id;
      if (aVal) active.value = aVal;
    }
    if (edit) {
      edit.innerHTML = opts;
      const eVal = cvVariantsState.some((x) => x.id === cvEditId) ? cvEditId : cvVariantsState[0]?.id;
      if (eVal) {
        cvEditId = eVal;
        edit.value = eVal;
      }
    }
    const btnRm = root.querySelector('#pf-cv-remove');
    if (btnRm) btnRm.disabled = cvVariantsState.length <= 1;
  }

  function fillProfileSelect(root, bundle) {
    const sel = root.querySelector('#pf-profile-select');
    if (!sel) return;
    const prev = bundle.activeProfileId;
    const opts = bundle.profiles
      .map((p) => {
        const id = escapeAttr(p.id);
        const lab =
          p.profileLabel != null && String(p.profileLabel).trim()
            ? String(p.profileLabel).trim()
            : [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || 'Profil';
        return `<option value="${id}">${escapeHtml(lab)}</option>`;
      })
      .join('');
    sel.innerHTML = opts;
    sel.value = bundle.profiles.some((p) => p.id === prev) ? prev : bundle.profiles[0].id;
    const btnRm = root.querySelector('#pf-profile-remove');
    if (btnRm) btnRm.disabled = bundle.profiles.length <= 1;
  }

  function toast(msg, isErr) {
    const app = global.InvooApp;
    if (app && app.showToast) app.showToast(msg, !!isErr);
    else if (isErr) console.error(msg);
    else console.info(msg);
  }

  function mountHtml(root) {
    root.innerHTML = `
<div class="settings-page">
  <nav class="settings-page-nav" aria-label="Sections de la page">
    <a href="#st-sec-profile">Profil</a>
    <a href="#st-sec-backup">Sauvegarde</a>
    <a href="#st-sec-blast">Envoi Blast</a>
    <a href="#st-sec-pool">Pool Gmail</a>
  </nav>
  <section class="panel settings-block" id="st-sec-profile">
    <div class="panel-h"><h2>Profil utilisateur</h2>
      <button type="button" class="btn primary" id="st-profile-save">Enregistrer le profil</button>
    </div>
    <div class="panel-b settings-form-grid">
      <div class="settings-field span-2">
        <label for="pf-profile-select">Profils utilisateur</label>
        <div class="row-actions" style="margin:0 0 0.65rem 0;flex-wrap:wrap;gap:0.5rem;align-items:center">
          <select id="pf-profile-select" class="editor-input" style="max-width:min(100%,380px)"></select>
          <button type="button" class="btn" id="pf-profile-add">Ajouter un profil</button>
          <button type="button" class="btn" id="pf-profile-remove">Supprimer ce profil</button>
        </div>
        <label for="pf-profile-label">Libellé du profil (menu)</label>
        <input id="pf-profile-label" type="text" class="editor-input" placeholder="ex. CDI, Freelance, Association…"/>
        <p class="editor-hint" style="margin-top:8px">Ici vous éditez le <strong>profil actif</strong> (référence du tableau de bord et valeurs par défaut). Dans l’<strong>Éditeur e-mail</strong>, le menu profil peut <strong>lier un autre profil au brouillon</strong> : l’aperçu et l’<strong>envoi Blast</strong> utilisent alors ce profil‑là pour <code>{{prenom}}</code>, <code>{{@cv_html}}</code>, etc. Changer de profil dans cette liste enregistre d’abord le formulaire du profil courant.</p>
      </div>
      <div class="settings-field">
        <label for="pf-first">Prénom</label>
        <input id="pf-first" type="text" class="editor-input" autocomplete="given-name"/>
      </div>
      <div class="settings-field">
        <label for="pf-last">Nom</label>
        <input id="pf-last" type="text" class="editor-input" autocomplete="family-name"/>
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
      <div class="settings-field span-2">
        <label for="pf-email-subject">Objet e-mail</label>
        <input id="pf-email-subject" type="text" class="editor-input" placeholder="Objet par défaut (variables {{prenom}}, etc.)" autocomplete="off"/>
        <p class="editor-hint" style="margin-top:6px">Sert de <strong>valeur de repli</strong> si l’éditeur e-mail a un objet vide, et à l’<strong>envoi Blast</strong> dans ce cas. Stocké <strong>par profil</strong>.</p>
      </div>
      <div class="settings-field span-2">
        <label for="pf-email-replyto">Reply-To (optionnel)</label>
        <input id="pf-email-replyto" type="email" class="editor-input" placeholder="reponses@exemple.com" autocomplete="off"/>
        <p class="editor-hint" style="margin-top:6px">Même logique : utilisé si le brouillon n’a pas de Reply-To.</p>
      </div>
      <div class="settings-field span-2">
        <label for="pf-tpl-lang">Langue des modèles (Stage, Travail, Volontariat)</label>
        <select id="pf-tpl-lang" class="editor-input" style="max-width:min(100%,280px)">
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
        <p class="editor-hint" style="margin-top:6px">Quand ce profil est celui du <strong>brouillon</strong> (menu profil dans l’éditeur), le sélecteur de langue des modèles s’aligne sur ce réglage — les boutons Stage / Travail / Volontariat insèrent alors la variante FR ou EN.</p>
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
        <p class="editor-hint" style="margin-top:6px">Si ce champ reste <strong>vide</strong>, le bouton bleu <strong>Consulter mon CV</strong> (ancre vers le CV dans le mail) est masqué dans les modèles de base ; le bloc <code>{{@cv_html}}</code> et le bouton <strong>WhatsApp</strong> restent (si le numéro est renseigné).</p>
      </div>
      <div class="settings-field span-2">
        <label for="pf-cv-active">CV inséré dans l’envoi ({{@cv_html}})</label>
        <select id="pf-cv-active" class="editor-input" style="max-width:min(100%,480px)"></select>
        <p class="editor-hint" style="margin-top:8px">Ce bloc HTML part dans <code>{{@cv_html}}</code>. L’envoi Blast et l’éditeur prennent le CV du <strong>profil de fusion</strong> (profil lié au brouillon dans l’éditeur, sinon le profil actif affiché ici). Le menu ci‑dessus est <strong>enregistré automatiquement</strong> dès que vous changez de CV. Vous pouvez définir plusieurs CV ci‑dessous et les éditer séparément.</p>
      </div>
      <div class="settings-field span-2">
        <label for="pf-cv-edit">Éditer un CV HTML</label>
        <div class="row-actions" style="margin:0 0 0.65rem 0;flex-wrap:wrap;gap:0.5rem;align-items:center">
          <select id="pf-cv-edit" class="editor-input" style="max-width:min(100%,360px)"></select>
          <button type="button" class="btn" id="pf-cv-add">Ajouter un CV</button>
          <button type="button" class="btn" id="pf-cv-remove">Supprimer ce CV</button>
        </div>
        <label for="pf-cv-label">Libellé (menu)</label>
        <input id="pf-cv-label" type="text" class="editor-input" placeholder="ex. CV technique, CV court…"/>
        <label for="pf-cv-html" style="display:block;margin-top:0.65rem">HTML du CV</label>
        <textarea id="pf-cv-html" class="editor-textarea" rows="12" spellcheck="false" placeholder="Collez ici le HTML de votre CV (tableaux et styles inline recommandés pour Gmail). Sera inséré à la place de {{@cv_html}} pour le CV choisi ci‑dessus — le bouton « Voir mon CV » fait défiler jusqu’à ce bloc dans le même e-mail."></textarea>
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

  <section class="panel settings-block settings-backup-section" id="st-sec-backup">
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

  <section class="panel settings-block" id="st-sec-blast">
    <div class="panel-h">
      <h2>Configuration envoi (Blast)</h2>
      <div class="row-actions">
        <button type="button" class="btn" id="st-blast-verify" title="Vérifie le relais SMTP (mode local) ou le Worker (mode Cloud)">Tester la connexion</button>
        <button type="button" class="btn primary" id="st-blast-save">Enregistrer config</button>
      </div>
    </div>
    <div class="panel-b settings-form-grid">
      <div class="settings-field span-2">
        <span class="settings-label-like">Mode d’envoi</span>
        <div class="settings-radio-row" role="radiogroup" aria-label="Mode d’envoi">
          <label class="settings-check">
            <input type="radio" name="bc-send-mode" id="bc-mode-local" value="local" checked />
            <span>SMTP local</span>
          </label>
          <label class="settings-check">
            <input type="radio" name="bc-send-mode" id="bc-mode-cloud" value="cloud" />
            <span>Cloud (Worker API)</span>
          </label>
        </div>
        <span class="editor-hint" style="display:block;margin-top:0.35rem">Local : relais Node + comptes Gmail (comportement actuel). Cloud : envoi via un Worker HTTPS ; les clés API restent sur Cloudflare / Resend, pas dans l’app.</span>
      </div>
      <div class="settings-field span-2 bc-cloud-only" hidden>
        <label for="bc-worker-url">URL du Worker (Cloud)</label>
        <input id="bc-worker-url" type="url" class="editor-input" placeholder="https://votre-worker.workers.dev" autocomplete="off"/>
        <span class="editor-hint">URL de base uniquement (sans <code>/send</code>). Déployez le dossier <code>cloudflare-worker/</code> et définissez les secrets Resend sur le Worker.</span>
      </div>
      <div class="settings-field span-2 settings-toggle-row bc-local-only">
        <label class="settings-check">
          <input type="checkbox" id="bc-relay"/>
          <span>Relais de secours</span>
        </label>
        <span class="editor-hint">Utiliser le compte Gmail marqué « secours » si les comptes principaux sont indisponibles.</span>
      </div>
      <div class="settings-field span-2 settings-toggle-row bc-local-only">
        <label class="settings-check">
          <input type="checkbox" id="bc-disable-err"/>
          <span>Désactiver automatiquement le compte en erreur</span>
        </label>
        <span class="editor-hint">Si un envoi échoue sur une boîte, le moteur <strong>réessaie le même destinataire</strong> avec les <strong>autres comptes actifs</strong> du pool. Cochez cette option pour retirer du pool la boîte fautive (recommandé). Les erreurs type <strong>quota / limite d’envoi</strong> désactivent aussi la boîte pour laisser la place aux autres, même si cette case est décochée.</span>
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
        <label for="bc-jitter">Aléa sur le délai (max.)</label>
        <div class="settings-input-suffix">
          <input id="bc-jitter" type="number" min="0" max="120" step="1" class="editor-input"/>
          <span class="suffix">+ 0…n s</span>
        </div>
        <span class="editor-hint" style="display:block;margin-top:0.35rem">Pause <strong>supplémentaire aléatoire</strong> après le délai fixe (entre chaque message). Réduit une cadence trop régulière ; ne remplace pas un bon contenu ni les limites Gmail.</span>
      </div>
      <div class="settings-field bc-local-only">
        <label for="bc-rotate">Rotation pool</label>
        <div class="settings-input-suffix">
          <input id="bc-rotate" type="number" min="1" step="1" class="editor-input"/>
          <span class="suffix">e-mails / compte</span>
        </div>
      </div>
      <div class="settings-field span-2 settings-toggle-row bc-local-only">
        <label class="settings-check">
          <input type="checkbox" id="bc-list-unsub"/>
          <span>En-tête List-Unsubscribe (mailto expéditeur)</span>
        </label>
        <span class="editor-hint">Bonnes pratiques pour e-mails type liste / prospection : certaines messageries affichent « Se désabonner ». L’URL <code>mailto:</code> pointe vers le <strong>compte Gmail utilisé pour l’envoi</strong>. Nécessite un relais à jour (<code>server/smtp-relay.mjs</code>).</span>
      </div>
      <div class="settings-field span-2 settings-toggle-row">
        <label class="settings-check">
          <input type="checkbox" id="bc-plain-text"/>
          <span>Version texte brut (multipart ou champ <code>text</code> Worker)</span>
        </label>
        <span class="editor-hint">Mode local : le relais génère un <code>text/plain</code> à partir du HTML. Mode Cloud : le même extrait est envoyé au Worker (Resend) en champ <code>text</code> optionnel.</span>
      </div>
      <div class="settings-field span-2 bc-local-only">
        <label for="bc-smtp-relay">URL du relais SMTP</label>
        <input id="bc-smtp-relay" type="url" class="editor-input" placeholder="http://127.0.0.1:18765 ou https://votre-relais.onrender.com" autocomplete="off"/>
        <span class="editor-hint">Relais <strong>open source</strong> (<code>server/</code>) : <code>npm start</code> en local, ou déploiement HTTPS (Docker, <code>render.yaml</code>). URL de base sans <code>/send</code>. <strong>GitHub Pages est en HTTPS</strong> : un relais <code>http://127.0.0.1</code> ne fonctionnera pas depuis le site en ligne — déployez le relais en <code>https://…</code>, ou utilisez l’app en <code>http://localhost</code> pour le relais local. Pool Gmail ci‑dessous.</span>
      </div>
      <div class="settings-field span-2 bc-local-only">
        <label for="bc-relay-api-key">Clé API relais (optionnel)</label>
        <input id="bc-relay-api-key" type="password" class="editor-input" placeholder="Si INVOOBLAST_RELAY_API_KEY est défini sur le serveur" autocomplete="off"/>
        <span class="editor-hint">Laissez vide en local sans variable d’environnement. En production, même valeur que sur le serveur (voir <code>server/README.txt</code>).</span>
      </div>
      <p class="settings-footnote span-2">Ces paramètres sont lus par le moteur d’envoi Blast et <strong>récapitulés sur la page Envoi (Blast)</strong> (section Prêt à envoyer + tableau de configuration). Stockage uniquement sur cet appareil.</p>
    </div>
  </section>

  <section class="panel settings-block" id="st-sec-pool">
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
    const bundle = await loadProfilesBundle();
    fillProfileSelect(root, bundle);
    const p = normalizeStoredProfile(
      bundle.profiles.find((x) => x.id === bundle.activeProfileId) || bundle.profiles[0]
    );
    setInput(root, '#pf-profile-label', p.profileLabel);
    setInput(root, '#pf-first', p.firstName);
    setInput(root, '#pf-last', p.lastName);
    setInput(root, '#pf-role', p.jobTitle);
    setInput(root, '#pf-domains', p.expertiseDomains);
    setInput(root, '#pf-email', p.email);
    setInput(root, '#pf-email-subject', p.emailSubject);
    setInput(root, '#pf-email-replyto', p.emailReplyTo);
    setInput(root, '#pf-phone', p.phone);
    setInput(root, '#pf-site', p.website);
    setInput(root, '#pf-cv', p.cvUrl);
    cvVariantsState = p.cvHtmlVariants.map((x) => ({ ...x }));
    cvEditId = cvVariantsState[0]?.id || '';
    fillCvSelects(root);
    const activeSel = root.querySelector('#pf-cv-active');
    if (activeSel && p.selectedCvHtmlId && cvVariantsState.some((x) => x.id === p.selectedCvHtmlId)) {
      activeSel.value = p.selectedCvHtmlId;
    }
    const editSel = root.querySelector('#pf-cv-edit');
    if (editSel) editSel.value = cvEditId;
    loadCvVariantIntoForm(root);
    setInput(root, '#pf-address', p.addressLine);
    setInput(root, '#pf-zip', p.postalCode);
    setInput(root, '#pf-city', p.city);
    setInput(root, '#pf-country', p.country);
    const tplLang = root.querySelector('#pf-tpl-lang');
    if (tplLang) tplLang.value = normalizePreferredTemplateLang(p.preferredTemplateLang);
  }

  function getTextareaRaw(root, sel) {
    const el = root.querySelector(sel);
    return el ? String(el.value || '') : '';
  }

  function readProfileFromForm(root, profileId) {
    const merge = global.InvooEmailMerge;
    const sanitize =
      merge && typeof merge.sanitizeCvHtml === 'function' ? merge.sanitizeCvHtml : (h) => String(h || '').trim();
    syncCvFormToState(root);
    const sanitizedVariants = cvVariantsState.map((v, i) => ({
      id: v.id,
      label: String(v.label || '').trim() || `CV ${i + 1}`,
      html: sanitize(v.html == null ? '' : String(v.html))
    }));
    const activeEl = root.querySelector('#pf-cv-active');
    let selectedCvHtmlId = activeEl && activeEl.value ? String(activeEl.value) : '';
    if (!selectedCvHtmlId || !sanitizedVariants.some((v) => v.id === selectedCvHtmlId)) {
      selectedCvHtmlId = sanitizedVariants[0]?.id || '';
    }
    const activeHtml =
      sanitizedVariants.find((v) => v.id === selectedCvHtmlId)?.html ?? sanitizedVariants[0]?.html ?? '';
    return normalizeStoredProfile({
      id: profileId,
      profileLabel: getInputTrim(root, '#pf-profile-label') || 'Profil',
      firstName: getInputTrim(root, '#pf-first'),
      lastName: getInputTrim(root, '#pf-last'),
      jobTitle: getInputTrim(root, '#pf-role'),
      expertiseDomains: getInputTrim(root, '#pf-domains'),
      email: getInputTrim(root, '#pf-email'),
      emailSubject: getInputTrim(root, '#pf-email-subject'),
      emailReplyTo: getInputTrim(root, '#pf-email-replyto'),
      phone: getInputTrim(root, '#pf-phone'),
      website: getInputTrim(root, '#pf-site'),
      cvUrl: getInputTrim(root, '#pf-cv'),
      cvHtml: activeHtml,
      cvHtmlVariants: sanitizedVariants,
      selectedCvHtmlId: selectedCvHtmlId,
      addressLine: getInputTrim(root, '#pf-address'),
      postalCode: getInputTrim(root, '#pf-zip'),
      city: getInputTrim(root, '#pf-city'),
      country: getInputTrim(root, '#pf-country'),
      preferredTemplateLang: normalizePreferredTemplateLang(
        (() => {
          const el = root.querySelector('#pf-tpl-lang');
          return el ? el.value : '';
        })()
      ),
      updatedAt: Date.now()
    });
  }

  async function saveProfileFromForm(root, opts) {
    const silent = opts && opts.silent;
    const bundle = await loadProfilesBundle();
    const pid = bundle.activeProfileId;
    const idx = bundle.profiles.findIndex((p) => p.id === pid);
    if (idx < 0) return;
    bundle.profiles[idx] = readProfileFromForm(root, pid);
    const clean = await persistProfilesBundle(bundle);
    fillProfileSelect(root, clean);
    if (!silent) {
      await db.appendLog('info', 'Profil utilisateur enregistré.');
      toast('Profil enregistré localement.');
    }
    global.dispatchEvent(new CustomEvent('invooblast:profile-updated'));
  }

  async function setActiveProfileId(id) {
    const sel = id != null ? String(id).trim() : '';
    if (!sel) return false;
    const bundle = await loadProfilesBundle();
    if (!bundle.profiles.some((p) => p.id === sel)) return false;
    bundle.activeProfileId = sel;
    await persistProfilesBundle(bundle);
    global.dispatchEvent(new CustomEvent('invooblast:profile-updated'));
    return true;
  }

  async function getProfileById(id) {
    const want = id != null ? String(id).trim() : '';
    if (!want) return null;
    const bundle = await loadProfilesBundle();
    const p = bundle.profiles.find((x) => x.id === want);
    return p ? normalizeStoredProfile(p) : null;
  }

  async function listProfiles() {
    const bundle = await loadProfilesBundle();
    return bundle.profiles.map((p) => {
      const n = normalizeStoredProfile(p);
      return {
        id: n.id,
        label:
          n.profileLabel != null && String(n.profileLabel).trim()
            ? String(n.profileLabel).trim()
            : [n.firstName, n.lastName].filter(Boolean).join(' ').trim() || 'Profil'
      };
    });
  }

  /**
   * Change le CV actif ({{@cv_html}}) pour un profil donné (par défaut : profil actif Paramètres).
   * @param {string} id — id variante CV
   * @param {string} [forProfileId] — id profil dans le bundle ; si omis, profil actif global
   * @returns {Promise<boolean>} true si enregistré
   */
  async function setSelectedCvHtmlId(id, forProfileId) {
    const bundle = await loadProfilesBundle();
    const wantPid =
      forProfileId != null && String(forProfileId).trim()
        ? String(forProfileId).trim()
        : bundle.activeProfileId;
    const pid = bundle.profiles.some((p) => p.id === wantPid) ? wantPid : bundle.activeProfileId;
    const idx = bundle.profiles.findIndex((p) => p.id === pid);
    if (idx < 0) return false;
    let p = normalizeStoredProfile(bundle.profiles[idx]);
    const sel = id != null ? String(id).trim() : '';
    if (!sel || !p.cvHtmlVariants.some((v) => v.id === sel)) return false;
    const merge = global.InvooEmailMerge;
    const sanitize =
      merge && typeof merge.sanitizeCvHtml === 'function' ? merge.sanitizeCvHtml : (h) => String(h || '').trim();
    const activeHtml = sanitize(p.cvHtmlVariants.find((v) => v.id === sel).html);
    bundle.profiles[idx] = {
      ...p,
      selectedCvHtmlId: sel,
      cvHtml: activeHtml,
      updatedAt: Date.now()
    };
    await persistProfilesBundle(bundle);
    global.dispatchEvent(new CustomEvent('invooblast:profile-updated'));
    return true;
  }

  function updateBlastModeUi(root) {
    const cloud = !!(root.querySelector('#bc-mode-cloud') && root.querySelector('#bc-mode-cloud').checked);
    root.querySelectorAll('.bc-local-only').forEach((el) => {
      el.hidden = cloud;
    });
    const wc = root.querySelector('.bc-cloud-only');
    if (wc) wc.hidden = !cloud;
  }

  async function loadBlastIntoForm(root) {
    const c = { ...DEFAULT_BLAST, ...(await db.getMeta(META_BLAST)) };
    const mode = c.sendingMode === 'cloud' ? 'cloud' : 'local';
    const rLocal = root.querySelector('#bc-mode-local');
    const rCloud = root.querySelector('#bc-mode-cloud');
    if (rLocal) rLocal.checked = mode === 'local';
    if (rCloud) rCloud.checked = mode === 'cloud';
    setInput(root, '#bc-worker-url', c.cloudWorkerUrl ?? '');
    root.querySelector('#bc-relay').checked = !!c.useFallbackRelay;
    root.querySelector('#bc-disable-err').checked = c.disableOnError !== false;
    root.querySelector('#bc-start').value = String(c.startLine ?? 1);
    root.querySelector('#bc-quota').value = String(c.globalQuota ?? 500);
    root.querySelector('#bc-delay').value = String(c.delaySec ?? 15);
    const jit = root.querySelector('#bc-jitter');
    if (jit) jit.value = String(Math.min(120, Math.max(0, Number(c.delayJitterSec) || 0)));
    root.querySelector('#bc-rotate').value = String(c.rotationEvery ?? 50);
    const lu = root.querySelector('#bc-list-unsub');
    if (lu) lu.checked = !!c.listUnsubscribeHeader;
    const pt = root.querySelector('#bc-plain-text');
    if (pt) pt.checked = !!c.plainTextAlternative;
    let relayShow = c.smtpRelayUrl ?? DEFAULT_BLAST.smtpRelayUrl;
    if (global.InvooSmtpRelayClient && typeof global.InvooSmtpRelayClient.normalizeBaseUrl === 'function') {
      relayShow = global.InvooSmtpRelayClient.normalizeBaseUrl(relayShow);
    }
    setInput(root, '#bc-smtp-relay', relayShow);
    setInput(root, '#bc-relay-api-key', c.smtpRelayApiKey ?? '');
    updateBlastModeUi(root);
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
    const modeCloud = !!(root.querySelector('#bc-mode-cloud') && root.querySelector('#bc-mode-cloud').checked);
    const sendingMode = modeCloud ? 'cloud' : 'local';
    const c = {
      sendingMode,
      cloudWorkerUrl: getInputTrim(root, '#bc-worker-url'),
      startLine: Math.max(1, parseInt(root.querySelector('#bc-start').value, 10) || 1),
      globalQuota: Math.max(1, parseInt(root.querySelector('#bc-quota').value, 10) || 500),
      delaySec: Math.max(0, parseInt(root.querySelector('#bc-delay').value, 10) || 0),
      delayJitterSec: Math.min(
        120,
        Math.max(0, parseInt((root.querySelector('#bc-jitter') && root.querySelector('#bc-jitter').value) || '0', 10) || 0)
      ),
      rotationEvery: Math.max(1, parseInt(root.querySelector('#bc-rotate').value, 10) || 50),
      listUnsubscribeHeader: !!(root.querySelector('#bc-list-unsub') && root.querySelector('#bc-list-unsub').checked),
      plainTextAlternative: !!(root.querySelector('#bc-plain-text') && root.querySelector('#bc-plain-text').checked),
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
    rows.sort((a, b) => String(a.email).localeCompare(b.email, 'fr'));
    if (!rows.length) {
      container.innerHTML =
        '<p class="editor-hint">Aucun compte dans le pool. Ajoutez un Gmail avec un mot de passe d’application (stocké chiffré sur cet appareil).</p>';
      return;
    }
    const nAct = rows.filter((r) => !r.disabled).length;
    const nDis = rows.length - nAct;
    container.innerHTML = `
<p class="settings-pool-summary editor-hint" aria-live="polite"><strong>${rows.length}</strong> compte(s) · <strong>${nAct}</strong> actif(s) · <strong>${nDis}</strong> désactivé(s) — même affichage que la page <strong>Envoi (Blast)</strong>.</p>
<div style="overflow-x:auto">
<table class="settings-pool-table" role="grid">
  <thead><tr><th>Compte</th><th>État</th><th>Secours</th><th>Dernière erreur</th><th class="settings-pool-actions-col">Actions</th></tr></thead>
  <tbody>
    ${rows
      .map((r) => {
        const st = r.disabled ? '<span class="tag bad">Désactivé</span>' : '<span class="tag ok">Actif</span>';
        const fb = r.isFallback ? '<span class="tag info">Oui</span>' : '—';
        const errN = r.failCount ? ` <span class="dim">(${r.failCount} err.)</span>` : '';
        const lastErr = r.lastError
          ? `<span class="dim" title="${escapeAttr(truncateText(r.lastError, 500))}">${escapeHtml(truncateText(r.lastError, 48))}</span>`
          : '—';
        const toggleBtn = r.disabled
          ? `<button type="button" class="btn btn-small" data-pool-enable="${escapeAttr(r.id)}">Réactiver</button>`
          : `<button type="button" class="btn btn-small danger" data-pool-disable="${escapeAttr(r.id)}">Désactiver</button>`;
        return `
    <tr>
      <td>${escapeHtml(r.email)}${errN}</td>
      <td>${st}</td>
      <td>${fb}</td>
      <td>${lastErr}</td>
      <td class="settings-pool-actions-cell">
        <button type="button" class="btn btn-small" data-verify="${escapeAttr(r.id)}" title="Contrôle local uniquement : coffre, déchiffrement, format App Password — aucune connexion à Google">Contrôle local</button>
        ${toggleBtn}
        <button type="button" class="btn btn-small" data-remove="${escapeAttr(r.id)}">Retirer</button>
      </td>
    </tr>`;
      })
      .join('')}
  </tbody>
</table>
</div>
<p class="editor-hint" style="margin-top:0.65rem"><strong>Contrôle local</strong> : vérifie sur cet appareil que le secret est lisible et ressemble à un App Password Gmail (16 caractères). <strong>Aucune requête n’est envoyée à Google</strong> ; seul un envoi SMTP Blast confirmera que Google accepte la connexion. <strong>Désactiver</strong> retire la boîte de la rotation sans supprimer le secret (comme sur la page Blast).</p>`;
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
    container.querySelectorAll('[data-pool-disable]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-pool-disable');
        if (!id || typeof gmailStore.setAccountDisabled !== 'function') return;
        const dlg = global.InvooConfirm;
        const ok = dlg
          ? await dlg.show({
              title: 'Désactiver ce compte ?',
              message:
                'Il ne sera plus utilisé pour l’envoi Blast tant que vous ne le réactivez pas (ici ou sur la page Envoi).',
              confirmLabel: 'Désactiver',
              cancelLabel: 'Annuler',
              danger: true
            })
          : global.confirm('Désactiver ce compte pour l’envoi ?');
        if (!ok) return;
        try {
          await gmailStore.setAccountDisabled(id, true);
          toast('Compte désactivé pour l’envoi.');
          notifyBlastSettingsUpdated();
          await renderPoolList(container);
          if (global.InvooDashboard && global.InvooDashboard.refreshDashboard)
            global.InvooDashboard.refreshDashboard().catch(() => {});
        } catch (e) {
          toast(e.message || String(e), true);
        }
      });
    });
    container.querySelectorAll('[data-pool-enable]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-pool-enable');
        if (!id || typeof gmailStore.setAccountDisabled !== 'function') return;
        try {
          await gmailStore.setAccountDisabled(id, false);
          toast('Compte réactivé.');
          notifyBlastSettingsUpdated();
          await renderPoolList(container);
          if (global.InvooDashboard && global.InvooDashboard.refreshDashboard)
            global.InvooDashboard.refreshDashboard().catch(() => {});
        } catch (e) {
          toast(e.message || String(e), true);
        }
      });
    });
    container.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-remove');
        if (!id) return;
        const dlg = global.InvooConfirm;
        const ok = dlg
          ? await dlg.show({
              title: 'Retirer le compte ?',
              message: 'Retirer ce compte du pool ?',
              confirmLabel: 'Retirer',
              cancelLabel: 'Annuler',
              danger: true
            })
          : global.confirm('Retirer ce compte du pool ?');
        if (!ok) return;
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

  function truncateText(s, max) {
    const t = String(s || '');
    if (t.length <= max) return t;
    return `${t.slice(0, Math.max(0, max - 1))}…`;
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
    const pfProfileSelect = root.querySelector('#pf-profile-select');
    if (pfProfileSelect) {
      pfProfileSelect.addEventListener('change', async () => {
        try {
          let bundle = await loadProfilesBundle();
          const curId = bundle.activeProfileId;
          const curIdx = bundle.profiles.findIndex((p) => p.id === curId);
          if (curIdx >= 0) bundle.profiles[curIdx] = readProfileFromForm(root, curId);
          const nextId = pfProfileSelect.value;
          if (!bundle.profiles.some((p) => p.id === nextId)) return;
          bundle.activeProfileId = nextId;
          await persistProfilesBundle(bundle);
          const p = normalizeStoredProfile(
            bundle.profiles.find((x) => x.id === nextId) || bundle.profiles[0]
          );
          setInput(root, '#pf-profile-label', p.profileLabel);
          setInput(root, '#pf-first', p.firstName);
          setInput(root, '#pf-last', p.lastName);
          setInput(root, '#pf-role', p.jobTitle);
          setInput(root, '#pf-domains', p.expertiseDomains);
          setInput(root, '#pf-email', p.email);
          setInput(root, '#pf-email-subject', p.emailSubject);
          setInput(root, '#pf-email-replyto', p.emailReplyTo);
          setInput(root, '#pf-phone', p.phone);
          setInput(root, '#pf-site', p.website);
          setInput(root, '#pf-cv', p.cvUrl);
          cvVariantsState = p.cvHtmlVariants.map((x) => ({ ...x }));
          cvEditId = cvVariantsState[0]?.id || '';
          fillCvSelects(root);
          const activeSel = root.querySelector('#pf-cv-active');
          if (activeSel && p.selectedCvHtmlId && cvVariantsState.some((x) => x.id === p.selectedCvHtmlId)) {
            activeSel.value = p.selectedCvHtmlId;
          }
          const editSel = root.querySelector('#pf-cv-edit');
          if (editSel) editSel.value = cvEditId;
          loadCvVariantIntoForm(root);
          setInput(root, '#pf-address', p.addressLine);
          setInput(root, '#pf-zip', p.postalCode);
          setInput(root, '#pf-city', p.city);
          setInput(root, '#pf-country', p.country);
          const tplL = root.querySelector('#pf-tpl-lang');
          if (tplL) tplL.value = normalizePreferredTemplateLang(p.preferredTemplateLang);
          fillProfileSelect(root, bundle);
          global.dispatchEvent(new CustomEvent('invooblast:profile-updated'));
        } catch (e) {
          toast(e.message || String(e), true);
        }
      });
    }

    const pfProfileAdd = root.querySelector('#pf-profile-add');
    if (pfProfileAdd) {
      pfProfileAdd.addEventListener('click', async () => {
        try {
          let bundle = await loadProfilesBundle();
          const curId = bundle.activeProfileId;
          const curIdx = bundle.profiles.findIndex((p) => p.id === curId);
          if (curIdx >= 0) bundle.profiles[curIdx] = readProfileFromForm(root, curId);
          const nid = db.uuid();
          const n = normalizeStoredProfile({
            id: nid,
            profileLabel: `Profil ${bundle.profiles.length + 1}`
          });
          bundle.profiles.push(n);
          bundle.activeProfileId = nid;
          await persistProfilesBundle(bundle);
          await loadProfileIntoForm(root);
          global.dispatchEvent(new CustomEvent('invooblast:profile-updated'));
          toast('Profil ajouté.');
        } catch (e) {
          toast(e.message || String(e), true);
        }
      });
    }

    const pfProfileRemove = root.querySelector('#pf-profile-remove');
    if (pfProfileRemove) {
      pfProfileRemove.addEventListener('click', async () => {
        let bundle = await loadProfilesBundle();
        if (bundle.profiles.length <= 1) return;
        const dlg = global.InvooConfirm;
        const ok = dlg
          ? await dlg.show({
              title: 'Supprimer ce profil ?',
              message:
                'Les données de ce profil (identité, CV HTML, adresse…) seront effacées. Cette action est irréversible.',
              confirmLabel: 'Supprimer',
              cancelLabel: 'Annuler',
              danger: true
            })
          : global.confirm('Supprimer ce profil utilisateur ?');
        if (!ok) return;
        try {
          const curId = bundle.activeProfileId;
          bundle.profiles = bundle.profiles.filter((p) => p.id !== curId);
          bundle.activeProfileId = bundle.profiles[0].id;
          await persistProfilesBundle(bundle);
          await loadProfileIntoForm(root);
          global.dispatchEvent(new CustomEvent('invooblast:profile-updated'));
          toast('Profil supprimé.');
        } catch (e) {
          toast(e.message || String(e), true);
        }
      });
    }

    const pfCvEdit = root.querySelector('#pf-cv-edit');
    if (pfCvEdit) {
      pfCvEdit.addEventListener('change', () => {
        syncCvFormToState(root);
        cvEditId = pfCvEdit.value || cvEditId;
        loadCvVariantIntoForm(root);
      });
    }
    const pfCvAdd = root.querySelector('#pf-cv-add');
    if (pfCvAdd) {
      pfCvAdd.addEventListener('click', () => {
        syncCvFormToState(root);
        const nid = db && typeof db.uuid === 'function' ? db.uuid() : `cv-${Date.now()}`;
        cvVariantsState.push({
          id: nid,
          label: `CV ${cvVariantsState.length + 1}`,
          html: ''
        });
        cvEditId = nid;
        fillCvSelects(root);
        loadCvVariantIntoForm(root);
      });
    }
    const pfCvRemove = root.querySelector('#pf-cv-remove');
    if (pfCvRemove) {
      pfCvRemove.addEventListener('click', async () => {
        if (cvVariantsState.length <= 1) return;
        const dlg = global.InvooConfirm;
        const ok = dlg
          ? await dlg.show({
              title: 'Supprimer ce CV ?',
              message:
                'Ce bloc HTML sera retiré du profil. Le brouillon dans l’éditeur e-mail n’est pas modifié.',
              confirmLabel: 'Supprimer',
              cancelLabel: 'Annuler',
              danger: true
            })
          : global.confirm('Supprimer ce CV HTML ?');
        if (!ok) return;
        syncCvFormToState(root);
        const removed = cvEditId;
        cvVariantsState = cvVariantsState.filter((x) => x.id !== removed);
        cvEditId = cvVariantsState[0]?.id || '';
        fillCvSelects(root);
        loadCvVariantIntoForm(root);
      });
    }

    root.querySelector('#st-profile-save').addEventListener('click', () =>
      saveProfileFromForm(root).catch((e) => toast(e.message || String(e), true))
    );

    const pfCvActive = root.querySelector('#pf-cv-active');
    if (pfCvActive) {
      pfCvActive.addEventListener('change', () => {
        saveProfileFromForm(root, { silent: true }).catch((e) => toast(e.message || String(e), true));
      });
    }

    root.querySelector('#st-blast-save').addEventListener('click', () =>
      saveBlastFromForm(root).catch((e) => toast(e.message || String(e), true))
    );

    root.querySelector('#st-blast-verify').addEventListener('click', async () => {
      if (!net.isOnline()) {
        toast('Test : connexion Internet requise.', true);
        return;
      }
      const modeCloud = !!(root.querySelector('#bc-mode-cloud') && root.querySelector('#bc-mode-cloud').checked);
      try {
        if (modeCloud) {
          const wu = getInputTrim(root, '#bc-worker-url');
          const cw = global.InvooCloudWorkerClient;
          if (!cw || typeof cw.workerHealth !== 'function') {
            toast('Client Worker indisponible (rechargez la page).', true);
            return;
          }
          const h = await cw.workerHealth(wu);
          toast(h.ok ? `Worker OK (${wu || 'URL'})` : h.message, !h.ok);
        } else {
          let relayUrl = getInputTrim(root, '#bc-smtp-relay');
          if (!relayUrl) relayUrl = DEFAULT_BLAST.smtpRelayUrl;
          const client = global.InvooSmtpRelayClient;
          if (!client || typeof client.relayHealth !== 'function') {
            toast('Client relais indisponible (rechargez la page).', true);
            return;
          }
          const apiKey = getInputTrim(root, '#bc-relay-api-key');
          const h = await client.relayHealth(relayUrl, apiKey);
          toast(h.ok ? `Relais OK (${relayUrl})` : h.message, !h.ok);
        }
      } catch (e) {
        toast(e.message || String(e), true);
      }
    });

    root.querySelectorAll('input[name="bc-send-mode"]').forEach((radio) => {
      radio.addEventListener('change', () => updateBlastModeUi(root));
    });

    root.querySelector('#st-pool-reset').addEventListener('click', async () => {
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
        const dlg = global.InvooConfirm;
        const okImp = dlg
          ? await dlg.show({
              title: 'Importer la sauvegarde ?',
              message:
                'Remplacer toutes les données locales INVOOBLAST par cette sauvegarde ? Action irréversible sans une autre copie de secours.',
              confirmLabel: 'Importer',
              cancelLabel: 'Annuler',
              danger: true
            })
          : global.confirm(
              'Remplacer toutes les données locales INVOOBLAST par cette sauvegarde ? Action irréversible sans une autre copie de secours.'
            );
        if (!okImp) return;
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
    getProfile: async () => {
      const bundle = await loadProfilesBundle();
      const p =
        bundle.profiles.find((x) => x.id === bundle.activeProfileId) || bundle.profiles[0];
      return normalizeStoredProfile(p);
    },
    getProfileById,
    listProfiles,
    setActiveProfileId,
    setSelectedCvHtmlId
  };
})(window);
