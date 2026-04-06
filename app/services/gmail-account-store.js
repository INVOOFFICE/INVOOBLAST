/**
 * Persistance des comptes Gmail : e-mail en clair (identifiant), secret chiffré via InvooCryptoVault.
 * Ne jamais persister de mot de passe d’application en clair.
 */
(function (global) {
  'use strict';

  const { STORES, uuid, put, get, getAll, del } = global.InvooBlastDB;
  const vault = global.InvooCryptoVault;

  async function listAccounts() {
    return getAll(STORES.GMAIL_ACCOUNTS);
  }

  async function removeAccount(id) {
    await del(STORES.GMAIL_ACCOUNTS, id);
  }

  /**
   * Vérification locale : coffre déverrouillé, déchiffrement OK, format type « App Password » Gmail (16 caractères).
   * Ne remplace pas un test SMTP réel (moteur Blast à brancher).
   * @param {string} id
   * @returns {Promise<{ ok: boolean, message: string }>}
   */
  async function verifyAccount(id) {
    const accId = String(id || '').trim();
    if (!accId) return { ok: false, message: 'Identifiant de compte manquant.' };

    await vault.ensureUnlockedForDevice();
    const acc = await get(STORES.GMAIL_ACCOUNTS, accId);
    if (!acc) return { ok: false, message: 'Compte introuvable dans le pool.' };
    if (!acc.enc || !acc.enc.iv || !acc.enc.ciphertext) {
      return { ok: false, message: 'Aucun secret chiffré enregistré pour ce compte.' };
    }

    let parsed;
    try {
      const plain = await vault.decryptString(acc.enc);
      parsed = JSON.parse(plain);
    } catch (_) {
      return {
        ok: false,
        message: 'Échec du déchiffrement (coffre indisponible ou données corrompues). Rechargez la page ou ré-enregistrez le compte.'
      };
    }

    const rawPwd = String((parsed && parsed.appPassword) || '');
    const appPassword = rawPwd.replace(/\s/g, '');
    if (!appPassword) {
      return { ok: false, message: 'Secret vide après déchiffrement. Ré-enregistrez le mot de passe d’application.' };
    }
    if (appPassword.length !== 16) {
      return {
        ok: false,
        message: `Mot de passe d’application : ${appPassword.length} caractère(s) sans espaces — Google en délivre en général 16 (quatre groupes de quatre).`
      };
    }
    if (!/^[a-zA-Z0-9]{16}$/.test(appPassword)) {
      return {
        ok: false,
        message: 'Format inattendu : le mot de passe d’application Gmail doit être 16 caractères alphanumériques (sans espaces).'
      };
    }

    const email = String(acc.email || '')
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: 'Adresse e-mail du compte invalide.' };
    }

    return {
      ok: true,
      message:
        'Contrôle local OK — aucune connexion à Google : le secret est lisible et le format correspond à un App Password Gmail. Pour savoir si Google accepte ce couple e-mail / mot de passe, il faudra attendre l’envoi SMTP Blast (ou un test SMTP dédié).'
    };
  }

  /**
   * Identifiants SMTP pour le relais local (déchiffrement ; coffre requis).
   * @param {string} accountId
   * @returns {Promise<{ user: string, pass: string }|null>}
   */
  async function getSmtpAuth(accountId) {
    const accId = String(accountId || '').trim();
    if (!accId) return null;
    await vault.ensureUnlockedForDevice();
    const acc = await get(STORES.GMAIL_ACCOUNTS, accId);
    if (!acc || acc.disabled) return null;
    if (!acc.enc || !acc.enc.iv || !acc.enc.ciphertext) return null;
    let parsed;
    try {
      const plain = await vault.decryptString(acc.enc);
      parsed = JSON.parse(plain);
    } catch (_) {
      return null;
    }
    const rawPwd = String((parsed && parsed.appPassword) || '');
    const appPassword = rawPwd.replace(/\s/g, '');
    if (!appPassword) return null;
    const email = String(acc.email || '')
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return { user: email, pass: appPassword };
  }

  /**
   * @param {string} accountId
   * @param {{ ok: boolean, errorMessage?: string|null, disableOnError?: boolean }} outcome
   */
  async function recordSendOutcome(accountId, outcome) {
    const accId = String(accountId || '').trim();
    if (!accId) return;
    const acc = await get(STORES.GMAIL_ACCOUNTS, accId);
    if (!acc) return;
    const now = Date.now();
    if (outcome.ok) {
      await put(STORES.GMAIL_ACCOUNTS, {
        ...acc,
        failCount: 0,
        lastError: null,
        updatedAt: now
      });
      return;
    }
    const failCount = (acc.failCount || 0) + 1;
    const msg = outcome.errorMessage ? String(outcome.errorMessage).slice(0, 500) : 'Erreur envoi';
    const disableOnError = outcome.disableOnError !== false;
    await put(STORES.GMAIL_ACCOUNTS, {
      ...acc,
      failCount,
      lastError: msg,
      disabled: disableOnError ? true : !!acc.disabled,
      updatedAt: now
    });
  }

  /** Remet comptes actifs : efface erreurs et réactive (ne supprime pas les secrets). */
  async function resetPoolHealth() {
    const rows = await getAll(STORES.GMAIL_ACCOUNTS);
    const now = Date.now();
    for (const acc of rows) {
      await put(STORES.GMAIL_ACCOUNTS, {
        ...acc,
        disabled: false,
        failCount: 0,
        lastError: null,
        updatedAt: now
      });
    }
    return rows.length;
  }

  /**
   * Active ou désactive manuellement un compte (problème SMTP, boîte à isoler).
   * Si le compte était « secours », le drapeau secours est retiré.
   * @param {string} id
   * @param {boolean} disabled
   */
  async function setAccountDisabled(id, disabled) {
    const accId = String(id || '').trim();
    if (!accId) throw new Error('Compte requis');
    const acc = await get(STORES.GMAIL_ACCOUNTS, accId);
    if (!acc) throw new Error('Compte introuvable.');
    const nextDisabled = !!disabled;
    const now = Date.now();
    await put(STORES.GMAIL_ACCOUNTS, {
      ...acc,
      disabled: nextDisabled,
      updatedAt: now
    });
    if (nextDisabled && acc.isFallback) {
      await setFallbackAccount(null);
    }
  }

  /** Un seul compte « relais de secours » à la fois. */
  async function setFallbackAccount(idOrNull) {
    const rows = await getAll(STORES.GMAIL_ACCOUNTS);
    const now = Date.now();
    for (const acc of rows) {
      const isFb = idOrNull && acc.id === idOrNull;
      await put(STORES.GMAIL_ACCOUNTS, {
        ...acc,
        isFallback: !!isFb,
        updatedAt: now
      });
    }
  }

  /**
   * Crée ou met à jour le compte (même e-mail) avec secret chiffré.
   * @param {{ email: string, appPassword: string, label?: string, isFallback?: boolean }} raw
   */
  async function saveAccount(raw) {
    await vault.ensureUnlockedForDevice();
    const email = String(raw.email || '')
      .trim()
      .toLowerCase();
    if (!email) throw new Error('E-mail compte requis');
    const appPassword = String(raw.appPassword || '');
    if (!appPassword) throw new Error('Mot de passe d’application Gmail requis');

    const enc = await vault.encryptString(
      JSON.stringify({
        appPassword,
        /** Espace pour refresh token OAuth futur */
        oauth: null
      })
    );

    const all = await getAll(STORES.GMAIL_ACCOUNTS);
    const existing = all.find((a) => a.email === email);
    const now = Date.now();

    if (existing) {
      const next = {
        ...existing,
        enc,
        label: raw.label || existing.label || email,
        isFallback: raw.isFallback != null ? !!raw.isFallback : existing.isFallback,
        disabled: false,
        failCount: 0,
        lastError: null,
        updatedAt: now
      };
      await put(STORES.GMAIL_ACCOUNTS, next);
      if (next.isFallback) await setFallbackAccount(next.id);
      else if (existing.isFallback) await setFallbackAccount(null);
      return next;
    }

    const row = {
      id: uuid(),
      email,
      label: raw.label || email,
      isFallback: !!raw.isFallback,
      enc,
      disabled: false,
      failCount: 0,
      lastError: null,
      updatedAt: now
    };

    await put(STORES.GMAIL_ACCOUNTS, row);
    if (row.isFallback) await setFallbackAccount(row.id);
    return row;
  }

   
  global.InvooGmailAccountStore = {
    saveAccount,
    listAccounts,
    removeAccount,
    verifyAccount,
    getSmtpAuth,
    recordSendOutcome,
    resetPoolHealth,
    setFallbackAccount,
    setAccountDisabled
  };
})(typeof window !== 'undefined' ? window : self);
