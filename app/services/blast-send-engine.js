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

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
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
    let contacts = allContacts.filter((c) => c.listId === listId && c.valid !== false);
    contacts.sort((a, b) => String(a.email).localeCompare(String(b.email), 'fr'));

    const startIdx = Math.max(0, (Number(cfg.startLine) || 1) - 1);
    contacts = contacts.slice(startIdx);

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
    const draft = await editor.loadDraft();
    const templateRow = {
      html: (draft && draft.html) || '',
      subject: (draft && draft.subject) || '',
      replyTo: (draft && draft.replyTo) || ''
    };
    if (!String(templateRow.subject).trim()) {
      throw new Error('Objet du brouillon vide — enregistrez un sujet dans l’éditeur e-mail.');
    }
    if (!String(templateRow.html).trim()) {
      throw new Error('Corps du brouillon vide — enregistrez le message dans l’éditeur e-mail.');
    }

    const rot = Math.max(1, Number(cfg.rotationEvery) || 50);
    const delayMs = Math.max(0, Number(cfg.delaySec) || 0) * 1000;
    const disableOnError = cfg.disableOnError !== false;

    const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : () => {};

    let sent = 0;
    let failed = 0;
    const total = contacts.length;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const rows = await gmailStore.listAccounts();
      const pool = buildAccountPool(rows, cfg);
      if (!pool.length) {
        throw new Error(
          'Plus aucun compte Gmail actif dans le pool. Paramètres → Pool Gmail ou réinitialisez les comptes désactivés.'
        );
      }

      const accIndex = Math.floor(sent / rot) % pool.length;
      const account = pool[accIndex];

      const merged = await merge.mergeWithProfileAndContact(templateRow, contact);
      const auth = await gmailStore.getSmtpAuth(account.id);
      if (!auth) {
        failed++;
        await db.appendLog('error', 'Compte Gmail : impossible de lire les identifiants (coffre ou compte).', {
          accountId: account.id
        });
        onProgress({ phase: 'error', index: i + 1, total, sent, failed, lastTo: contact.email });
        continue;
      }

      const from = auth.user;
      const payload = {
        auth,
        from,
        to: String(contact.email || '').trim(),
        subject: merged.subject,
        html: merged.html
      };
      if (merged.replyTo) payload.replyTo = merged.replyTo;

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
      } catch (e) {
        failed++;
        const errMsg = e && e.message ? String(e.message) : 'Erreur envoi';
        await gmailStore.recordSendOutcome(account.id, {
          ok: false,
          errorMessage: errMsg,
          disableOnError
        });
        await db.put(db.STORES.SEND_HISTORY, {
          id: db.uuid(),
          campaignId: null,
          listId,
          contactId: contact.id,
          ts: Date.now(),
          status: 'failed',
          to: payload.to,
          from,
          accountId: account.id,
          subject: merged.subject,
          error: errMsg
        });
        await db.appendLog('error', 'Envoi Blast échoué.', { to: payload.to, error: errMsg });
        onProgress({ phase: 'error', index: i + 1, total, sent, failed, lastTo: contact.email, error: errMsg });
      }

      if (delayMs > 0 && i < contacts.length - 1) await sleep(delayMs);
    }

    onProgress({ phase: 'done', index: total, total, sent, failed, lastTo: null });
    global.dispatchEvent(new CustomEvent('invooblast:blast-settings-updated'));
    global.dispatchEvent(new CustomEvent('invooblast:send-finished'));

    return { sent, failed, total };
  }

  global.InvooBlastSend = { runBlastSend };
})(typeof window !== 'undefined' ? window : self);
