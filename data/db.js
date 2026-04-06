/**
 * INVOOBLAST — Couche IndexedDB (offline-first, sans backend).
 * Toutes les données métier sont locales : listes, modèles, campagnes, historique, comptes (chiffrés séparément).
 */
(function (global) {
  'use strict';

  const DB_NAME = 'invooblast_db';
  const DB_VERSION = 1;

  /** Noms des magasins d’objets (stores) */
  const STORES = {
    META: 'meta',
    LISTS: 'lists',
    CONTACTS: 'contacts',
    TEMPLATES: 'templates',
    CAMPAIGNS: 'campaigns',
    SEND_HISTORY: 'sendHistory',
    GMAIL_ACCOUNTS: 'gmailAccounts',
    CHECKPOINTS: 'checkpoints',
    LOGS: 'logs'
  };

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORES.LISTS)) {
          db.createObjectStore(STORES.LISTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.CONTACTS)) {
          const c = db.createObjectStore(STORES.CONTACTS, { keyPath: 'id' });
          c.createIndex('by_list', 'listId', { unique: false });
          c.createIndex('by_email', 'emailNorm', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.TEMPLATES)) {
          db.createObjectStore(STORES.TEMPLATES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.CAMPAIGNS)) {
          db.createObjectStore(STORES.CAMPAIGNS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SEND_HISTORY)) {
          const h = db.createObjectStore(STORES.SEND_HISTORY, { keyPath: 'id' });
          h.createIndex('by_campaign', 'campaignId', { unique: false });
          h.createIndex('by_ts', 'ts', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.GMAIL_ACCOUNTS)) {
          db.createObjectStore(STORES.GMAIL_ACCOUNTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.CHECKPOINTS)) {
          db.createObjectStore(STORES.CHECKPOINTS, { keyPath: 'campaignId' });
        }
        if (!db.objectStoreNames.contains(STORES.LOGS)) {
          const l = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
          l.createIndex('by_ts', 'ts', { unique: false });
        }
      };
    });
    return dbPromise;
  }

  function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function put(store, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(store).put(value);
    });
  }

  async function get(store, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const rq = tx.objectStore(store).get(key);
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
    });
  }

  async function getAll(store) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const rq = tx.objectStore(store).getAll();
      rq.onsuccess = () => resolve(rq.result || []);
      rq.onerror = () => reject(rq.error);
    });
  }

  async function del(store, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(store).delete(key);
    });
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  function normalizeEmail(email) {
    return String(email || '')
      .trim()
      .toLowerCase();
  }

  /** Méta-clés UI légères (thème, etc.) — petites valeurs seulement */
  async function getMeta(key, defaultValue = null) {
    const row = await get(STORES.META, key);
    return row ? row.value : defaultValue;
  }

  async function setMeta(key, value) {
    await put(STORES.META, { key, value, updatedAt: Date.now() });
  }

  /** Statistiques agrégées pour le tableau de bord */
  async function getDashboardStats() {
    const [lists, contacts, campaigns, history, accounts, draftMeta] = await Promise.all([
      getAll(STORES.LISTS),
      getAll(STORES.CONTACTS),
      getAll(STORES.CAMPAIGNS),
      getAll(STORES.SEND_HISTORY),
      getAll(STORES.GMAIL_ACCOUNTS),
      getMeta('email_editor_draft', null)
    ]);

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const sentToday = history.filter((h) => h.ts >= dayAgo && h.status === 'sent').length;
    const failedToday = history.filter((h) => h.ts >= dayAgo && h.status === 'failed').length;
    const validContacts = contacts.filter((c) => c.valid !== false).length;
    const activeAccounts = accounts.filter((a) => !a.disabled).length;
    const dr = draftMeta && typeof draftMeta === 'object' ? draftMeta : {};
    const emailDraftActive = Boolean(String(dr.subject || '').trim() || String(dr.html || '').trim());

    return {
      listCount: lists.length,
      contactCount: contacts.length,
      validContactCount: validContacts,
      emailDraftActive,
      campaignCount: campaigns.length,
      activeCampaignCount: campaigns.filter((c) => c.status === 'running' || c.status === 'draft').length,
      sentToday,
      failedToday,
      historyTotal: history.length,
      gmailAccountCount: accounts.length,
      activeGmailAccountCount: activeAccounts,
      lastUpdated: now
    };
  }

  async function appendLog(level, message, meta) {
    await put(STORES.LOGS, {
      id: uuid(),
      level,
      message,
      meta: meta || null,
      ts: Date.now()
    });
  }

  /** Amorce avec jeux de données vides cohérents si première ouverture */
  async function seedIfEmpty() {
    const lists = await getAll(STORES.LISTS);
    if (lists.length) return;
    await appendLog('info', 'Base locale initialisée (IndexedDB).', { DB_NAME, DB_VERSION });
  }

  /** Format fichier « Sauvegarde portable » (Paramètres). */
  const BACKUP_FORMAT = 'invooblast-backup';
  const BACKUP_VERSION = 1;

  const BACKUP_STORE_ORDER = [
    STORES.META,
    STORES.LISTS,
    STORES.CONTACTS,
    STORES.TEMPLATES,
    STORES.CAMPAIGNS,
    STORES.SEND_HISTORY,
    STORES.GMAIL_ACCOUNTS,
    STORES.CHECKPOINTS,
    STORES.LOGS
  ];

  /**
   * Construit l’objet sauvegarde (IndexedDB + clés coffre localStorage requises pour les comptes Gmail chiffrés).
   * @returns {Promise<object>}
   */
  async function exportBackup() {
    const vault = global.InvooCryptoVault;
    const vaultLocal =
      vault && typeof vault.snapshotLocalStorageForBackup === 'function'
        ? vault.snapshotLocalStorageForBackup()
        : {};
    const stores = {};
    for (const name of BACKUP_STORE_ORDER) {
      stores[name] = await getAll(name);
    }
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: Date.now(),
      dbSchemaVersion: DB_VERSION,
      app: 'INVOOBLAST',
      vaultLocalStorage: vaultLocal,
      stores
    };
  }

  /**
   * Restauration destructive : remplace toutes les entrées des stores listés + fusionne les clés coffre si présentes.
   * @param {object} parsed — objet déjà JSON.parse
   */
  async function importBackup(parsed) {
    if (!parsed || typeof parsed !== 'object') throw new Error('Données invalides.');
    if (parsed.format !== BACKUP_FORMAT) throw new Error('Ce fichier n’est pas une sauvegarde INVOOBLAST.');
    if (parsed.version !== BACKUP_VERSION) throw new Error('Version de sauvegarde non prise en charge.');
    const stores = parsed.stores || parsed.data;
    if (!stores || typeof stores !== 'object') throw new Error('Sauvegarde incomplète (stores manquants).');

    const vault = global.InvooCryptoVault;
    if (parsed.vaultLocalStorage && typeof parsed.vaultLocalStorage === 'object') {
      const hasAny = Object.keys(parsed.vaultLocalStorage).length > 0;
      if (hasAny) {
        if (vault && typeof vault.restoreLocalStorageFromBackup === 'function') {
          vault.restoreLocalStorageFromBackup(parsed.vaultLocalStorage);
        } else {
          for (const [k, v] of Object.entries(parsed.vaultLocalStorage)) {
            if (v != null) global.localStorage.setItem(k, String(v));
          }
        }
      }
    }
    if (vault && typeof vault.lockVault === 'function') vault.lockVault();

    const idb = await openDB();
    await new Promise((resolve, reject) => {
      const tx = idb.transaction(BACKUP_STORE_ORDER, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      for (const name of BACKUP_STORE_ORDER) {
        const os = tx.objectStore(name);
        os.clear();
        const rows = Array.isArray(stores[name]) ? stores[name] : [];
        for (const row of rows) {
          os.put(row);
        }
      }
    });

    if (vault && typeof vault.ensureUnlockedForDevice === 'function') {
      await vault.ensureUnlockedForDevice();
    }

    await appendLog('info', 'Données restaurées depuis une sauvegarde JSON.', {
      exportedAt: parsed.exportedAt,
      dbSchemaVersion: parsed.dbSchemaVersion
    });
  }

  async function importBackupFromJsonText(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw new Error('Fichier JSON illisible ou tronqué.');
    }
    await importBackup(parsed);
  }

  /** Export « base propre » : listes + contacts encore valides (hors sauvegarde complète coffre / historique). */
  const CLEAN_EXPORT_FORMAT = 'invooblast-clean-lists';
  const CLEAN_EXPORT_VERSION = 1;

  async function exportCleanListsPayload() {
    const [lists, contacts] = await Promise.all([getAll(STORES.LISTS), getAll(STORES.CONTACTS)]);
    const validContacts = contacts.filter((c) => c.valid !== false);
    const invalidContacts = contacts.filter((c) => c.valid === false);
    return {
      format: CLEAN_EXPORT_FORMAT,
      version: CLEAN_EXPORT_VERSION,
      exportedAt: Date.now(),
      app: 'INVOOBLAST',
      note:
        'Uniquement les contacts avec valid !== false. Pas une sauvegarde complète (pas d’historique d’envoi, pas des comptes Gmail chiffrés — utiliser Paramètres → Exporter pour cela).',
      lists,
      contacts: validContacts,
      summary: {
        listCount: lists.length,
        contactTotal: contacts.length,
        contactValid: validContacts.length,
        contactInvalid: invalidContacts.length
      }
    };
  }

  const api = {
    STORES,
    openDB,
    uuid,
    normalizeEmail,
    getMeta,
    setMeta,
    get,
    getAll,
    put,
    del,
    getDashboardStats,
    appendLog,
    seedIfEmpty,
    BACKUP_FORMAT,
    BACKUP_VERSION,
    CLEAN_EXPORT_FORMAT,
    CLEAN_EXPORT_VERSION,
    exportBackup,
    exportCleanListsPayload,
    importBackup,
    importBackupFromJsonText
  };

   
  global.InvooBlastDB = api;
})(typeof window !== 'undefined' ? window : self);
