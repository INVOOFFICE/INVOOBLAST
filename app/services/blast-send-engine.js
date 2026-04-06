/**
 * Moteur d’envoi Blast : fusion brouillon + contacts, rotation pool Gmail, relais SMTP local.
 */
(function (global) {
  'use strict';

  const db = global.InvooBlastDB;
  const net = global.InvooNetwork;
  const vault = global.InvooCryptoVault;
  const relay = global.InvooSmtpRelayClient;
  const gmailStore = global.InvooGmailAccountStore;
  const merge = global.InvooEmailMerge;
  const settings = global.InvooSettings;

  /** Reprise d’envoi : prochaine ligne (1-based) dans la liste triée des contacts valides. */
  const META_BLAST_RESUME = 'blast_resume_v1';

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /** Contrôle partagé pour l’envoi en cours (pause / arrêt). */
  let activeControl = null;

  async function waitWhilePausedAndDelay(ms, control) {
    if (!ms || ms <= 0) return;
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (control.aborted) return;
      while (control.paused && !control.aborted) {
        await sleep(200);
      }
      if (control.aborted) return;
      const left = end - Date.now();
      if (left <= 0) break;
      await sleep(Math.min(250, left));
    }
  }

  function pauseSend() {
    if (activeControl) activeControl.paused = true;
  }

  function resumeSend() {
    if (activeControl) activeControl.paused = false;
  }

  function abortSend() {
    if (activeControl) activeControl.aborted = true;
  }

  function isSendRunning() {
    return activeControl != null;
  }

  function isSendPaused() {
    return activeControl && activeControl.paused && !activeControl.aborted;
  }

  function buildAccountPool(rows, cfg) {
    const active = rows.filter((a) => !a.disabled);
    const fb = active.filter((a) => a.isFallback);
    const main = active.filter((a) => !a.isFallback);
    const sortE = (a, b) => String(a.email).localeCompare(String(b.email), 'fr');
    let order = [...main.sort(sortE), ...fb.sort(sortE)];
    if (cfg.useFallbackRelay === false) {
      order = main.sort(sortE);
    }
    return order;
  }

  /** Quota / limite d’envoi (Gmail, etc.) : désactiver ce compte pour laisser la rotation utiliser les autres. */
  function shouldForceDisableAccount(errMsg) {
    const m = String(errMsg || '').toLowerCase();
    if (!m) return false;
    return /quota|quotidi|daily\s*sending|sending\s*limit|rate\s*limit|ratelimit|too\s+many|exceed|4\.2\.2|452|450|421|5\.4\.5|5\.7\.1|temporary\s+failure/i.test(
      m
    );
  }

  /**
   * @param {{ listId: string, onProgress?: function }} opts
   * @returns {Promise<{ sent: number, failed: number, total: number }>}
   */
  async function runBlastSend(opts) {
    if (!db || !relay || !gmailStore || !merge || !settings) {
      throw new Error('Services Blast incomplets (rechargez la page).');
    }

    await net.requireOnline('Envoi Blast : connexion Internet requise.');

    if (vault && typeof vault.ensureUnlockedForDevice === 'function') {
      await vault.ensureUnlockedForDevice();
    }

    const listId = String((opts && opts.listId) || '').trim();
    if (!listId) throw new Error('Choisissez une liste de destinataires.');

    const cfg = { ...(await settings.getBlastConfig()) };
    const relayUrl = relay.normalizeBaseUrl(cfg.smtpRelayUrl);

    const relayApiKey = cfg.smtpRelayApiKey != null ? String(cfg.smtpRelayApiKey) : '';
    const health = await relay.relayHealth(relayUrl, relayApiKey);
    if (!health.ok) throw new Error(health.message);
    const sendRelayBase = health.resolvedBase || relayUrl;

    const listRow = await db.get(db.STORES.LISTS, listId);
    if (!listRow) throw new Error('Liste introuvable ou supprimée.');

    const allContacts = await db.getAll(db.STORES.CONTACTS);
    const contactsFull = allContacts
      .filter((c) => c.listId === listId && c.valid !== false)
      .sort((a, b) => String(a.email).localeCompare(String(b.email), 'fr'));

    const cfgLine = Math.max(1, Number(cfg.startLine) || 1);
    const useResume = !!(opts && opts.useResume === true && opts.resumeFromLine1Based != null);
    const resumeLine1 = useResume
      ? Math.max(1, Math.floor(Number(opts.resumeFromLine1Based)) || 1)
      : null;
    const startIdx =
      resumeLine1 != null
        ? Math.min(contactsFull.length, Math.max(0, resumeLine1 - 1))
        : Math.max(0, cfgLine - 1);

    let contacts = contactsFull.slice(startIdx);

    const quota = Math.max(1, Number(cfg.globalQuota) || 500);
    const maxN = Math.min(quota, contacts.length);
    contacts = contacts.slice(0, maxN);

    if (!contacts.length) {
      throw new Error(
        'Aucun contact valide à envoyer. Vérifiez la liste, les e-mails valides et la ligne de départ (Paramètres).'
      );
    }

    const editor = global.InvooEmailEditor;
    if (!editor || typeof editor.loadDraft !== 'function') {
      throw new Error('Éditeur e-mail indisponible.');
    }
    if (typeof editor.persistDraftFromEditorDom === 'function') {
      await editor.persistDraftFromEditorDom();
    }
    const draft = await editor.loadDraft();

    let profileForSend = null;
    const dpid = draft.draftProfileId != null ? String(draft.draftProfileId).trim() : '';
    if (dpid && settings && typeof settings.getProfileById === 'function') {
      profileForSend = await settings.getProfileById(dpid);
    }
    if (!profileForSend && settings && typeof settings.getProfile === 'function') {
      profileForSend = await settings.getProfile();
    }

    const rawSubj = String((draft && draft.subject) || '');
    const rawRto = String((draft && draft.replyTo) || '');
    const subjDraftTrim = rawSubj.trim();
    const rtoDraftTrim = rawRto.trim();
    const subjProf = profileForSend ? String(profileForSend.emailSubject || '').trim() : '';
    const rtoProf = profileForSend ? String(profileForSend.emailReplyTo || '').trim() : '';
    const templateRow = {
      html: (draft && draft.html) || '',
      /** Texte exact du brouillon si non vide ; sinon repli profil (Paramètres). */
      subject: subjDraftTrim ? rawSubj : subjProf,
      replyTo: rtoDraftTrim ? rawRto.trim() : rtoProf
    };

    if (!String(templateRow.subject).trim()) {
      throw new Error(
        'Objet vide — renseignez-le dans l’éditeur e-mail ou dans Paramètres → Profil (Objet e-mail).'
      );
    }
    if (!String(templateRow.html).trim()) {
      throw new Error('Corps du brouillon vide — enregistrez le message dans l’éditeur e-mail.');
    }

    const rot = Math.max(1, Number(cfg.rotationEvery) || 50);
    const delayMs = Math.max(0, Number(cfg.delaySec) || 0) * 1000;
    const jitterSec = Math.min(120, Math.max(0, Number(cfg.delayJitterSec) || 0));
    const listUnsubscribeHeader = !!cfg.listUnsubscribeHeader;
    const plainTextAlternative = !!cfg.plainTextAlternative;
    const disableOnError = cfg.disableOnError !== false;

    function randomJitterMs() {
      if (jitterSec <= 0) return 0;
      return Math.floor(Math.random() * (jitterSec * 1000 + 1));
    }

    const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : () => {};

    if (activeControl) {
      throw new Error('Un envoi est déjà en cours (utilisez Pause ou Arrêter).');
    }

    const control = { paused: false, aborted: false };
    activeControl = control;

    let sent = 0;
    let failed = 0;
    const total = contacts.length;

    try {
    for (let i = 0; i < contacts.length; i++) {
      while (control.paused && !control.aborted) {
        await sleep(200);
      }
      if (control.aborted) break;

      const contact = contacts[i];
      const merged = await merge.mergeWithProfileAndContact(templateRow, contact, profileForSend);
      const toAddr = String(contact.email || '').trim();

      const triedAccountIds = new Set();
      let delivered = false;
      let lastErrMsg = '';
      let lastFrom = '';
      let lastAccountId = '';

      while (!delivered && !control.aborted) {
        const rows = await gmailStore.listAccounts();
        const pool = buildAccountPool(rows, cfg);
        if (!pool.length) {
          if (triedAccountIds.size === 0) {
            throw new Error(
              'Plus aucun compte Gmail actif dans le pool. Paramètres → Pool Gmail ou réinitialisez les comptes désactivés.'
            );
          }
          break;
        }

        const n = pool.length;
        const rotBase = Math.floor(sent / rot) % n;
        let account = null;
        for (let t = 0; t < n; t++) {
          const cand = pool[(rotBase + t) % n];
          if (!triedAccountIds.has(cand.id)) {
            account = cand;
            break;
          }
        }
        if (!account) break;

        triedAccountIds.add(account.id);
        lastAccountId = account.id;

        const auth = await gmailStore.getSmtpAuth(account.id);
        if (!auth) {
          await db.appendLog('error', 'Compte Gmail : identifiants indisponibles (désactivé ou coffre).', {
            accountId: account.id
          });
          continue;
        }

        const from = auth.user;
        lastFrom = from;
        const payload = {
          auth,
          from,
          to: toAddr,
          subject: merged.subject,
          html: merged.html
        };
        if (merged.replyTo) payload.replyTo = merged.replyTo;
        if (listUnsubscribeHeader) payload.listUnsubscribeHeader = true;
        if (plainTextAlternative) payload.plainTextAlternative = true;

        onProgress({
          phase: 'sending',
          index: i + 1,
          total,
          sent,
          failed,
          lastTo: contact.email,
          from
        });

        try {
          await relay.relaySendMail(sendRelayBase, payload, relayApiKey);
          sent++;
          await gmailStore.recordSendOutcome(account.id, { ok: true, disableOnError });
          await db.put(db.STORES.SEND_HISTORY, {
            id: db.uuid(),
            campaignId: null,
            listId,
            contactId: contact.id,
            ts: Date.now(),
            status: 'sent',
            to: payload.to,
            from,
            accountId: account.id,
            subject: merged.subject,
            error: null
          });
          await db.appendLog('info', 'Envoi Blast réussi.', { to: payload.to, accountId: account.id });
          delivered = true;
        } catch (e) {
          const errMsg = e && e.message ? String(e.message) : 'Erreur envoi';
          lastErrMsg = errMsg;
          const doDisable = disableOnError !== false || shouldForceDisableAccount(errMsg);
          await gmailStore.recordSendOutcome(account.id, {
            ok: false,
            errorMessage: errMsg,
            disableOnError: doDisable
          });
          await db.appendLog('error', 'Envoi Blast échoué (autre compte sera essayé si disponible).', {
            to: payload.to,
            accountId: account.id,
            error: errMsg
          });
        }
      }

      if (!delivered && !control.aborted) {
        failed++;
        await db.put(db.STORES.SEND_HISTORY, {
          id: db.uuid(),
          campaignId: null,
          listId,
          contactId: contact.id,
          ts: Date.now(),
          status: 'failed',
          to: toAddr,
          from: lastFrom || '—',
          accountId: lastAccountId || null,
          subject: merged.subject,
          error: lastErrMsg || 'Aucun compte du pool n’a pu envoyer.'
        });
        await db.appendLog('error', 'Envoi Blast : échec sur tous les comptes essayés pour ce destinataire.', {
          to: toAddr,
          error: lastErrMsg
        });
        onProgress({
          phase: 'error',
          index: i + 1,
          total,
          sent,
          failed,
          lastTo: contact.email,
          error: lastErrMsg || 'Tous les comptes ont échoué ou sont indisponibles.'
        });
      }

      const nextAbs0 = startIdx + i + 1;
      if (nextAbs0 < contactsFull.length) {
        await db.setMeta(META_BLAST_RESUME, {
          listId,
          nextLine1Based: nextAbs0 + 1,
          lastProcessedEmail: String(contact.email || '').trim(),
          ts: Date.now()
        });
      } else {
        await db.del(db.STORES.META, META_BLAST_RESUME);
      }

      if (control.aborted) break;
      if (i < contacts.length - 1) {
        const betweenMs = delayMs + randomJitterMs();
        if (betweenMs > 0) await waitWhilePausedAndDelay(betweenMs, control);
      }
    }

    if (control.aborted) {
      onProgress({
        phase: 'aborted',
        index: Math.min(sent + failed, total),
        total,
        sent,
        failed,
        lastTo: null
      });
      await db.appendLog('info', 'Envoi Blast interrompu par l’utilisateur.', { sent, failed, total });
    } else {
      onProgress({ phase: 'done', index: total, total, sent, failed, lastTo: null });
    }
    global.dispatchEvent(new CustomEvent('invooblast:blast-settings-updated'));
    global.dispatchEvent(new CustomEvent('invooblast:send-finished'));

    return { sent, failed, total, aborted: control.aborted };
    } finally {
      activeControl = null;
    }
  }

  async function clearBlastResume() {
    await db.del(db.STORES.META, META_BLAST_RESUME);
    global.dispatchEvent(new CustomEvent('invooblast:blast-resume-updated'));
  }

  function getBlastResumeState() {
    return db.getMeta(META_BLAST_RESUME, null);
  }

  global.InvooBlastSend = {
    runBlastSend,
    pauseSend,
    resumeSend,
    abortSend,
    isSendRunning,
    isSendPaused,
    META_BLAST_RESUME,
    clearBlastResume,
    getBlastResumeState
  };
})(typeof window !== 'undefined' ? window : self);
