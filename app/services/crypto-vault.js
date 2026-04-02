/**
 * Chiffrement local Web Crypto : AES-GCM pour les secrets (ex. mots de passe d’application Gmail).
 * Aucun secret en clair en IndexedDB : blobs { iv, ciphertext } en base64.
 * Par défaut : clé dérivée (PBKDF2) à partir d’une valeur aléatoire par appareil (localStorage),
 * chargée en mémoire au démarrage via ensureUnlockedForDevice(). unlockVault() reste utilisable pour un mode avancé.
 */
(function (global) {
  'use strict';

  const LS_VAULT_SALT = 'invooblast_vault_salt_v1';
  /** Clé matérielle stockée en local (pas de phrase utilisateur) — générée au premier lancement. */
  const LS_DEVICE_PK = 'invooblast_device_pk_v1';
  const ITERATIONS = 210000;

  let memoryKey = null;

  function bytesToB64(buf) {
    const bin = String.fromCharCode.apply(null, new Uint8Array(buf));
    return btoa(bin);
  }

  function b64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function randomBytes(n) {
    const buf = new Uint8Array(n);
    crypto.getRandomValues(buf);
    return buf;
  }

  function getOrCreateSalt() {
    let s = localStorage.getItem(LS_VAULT_SALT);
    if (!s) {
      s = bytesToB64(randomBytes(16));
      localStorage.setItem(LS_VAULT_SALT, s);
    }
    return b64ToBytes(s);
  }

  async function deriveKey(passphrase, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, [
      'deriveKey'
    ]);
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function unlockVault(passphrase) {
    if (!passphrase) throw new Error('Passphrase vide');
    const salt = getOrCreateSalt();
    memoryKey = await deriveKey(passphrase, salt);
    return true;
  }

  /**
   * Déverrouille le coffre avec une clé aléatoire par appareil (localStorage).
   * Les App Password restent chiffrés en IndexedDB ; aucune saisie utilisateur.
   */
  async function ensureUnlockedForDevice() {
    if (memoryKey) return;
    let pk = localStorage.getItem(LS_DEVICE_PK);
    if (!pk) {
      pk = bytesToB64(randomBytes(32));
      localStorage.setItem(LS_DEVICE_PK, pk);
    }
    const salt = getOrCreateSalt();
    memoryKey = await deriveKey(pk, salt);
  }

  function lockVault() {
    memoryKey = null;
  }

  /** Clés localStorage nécessaires pour déchiffrer les secrets après import sur un autre appareil. */
  const BACKUP_LS_KEYS = [LS_VAULT_SALT, LS_DEVICE_PK];

  function snapshotLocalStorageForBackup() {
    const o = {};
    for (const k of BACKUP_LS_KEYS) {
      const v = localStorage.getItem(k);
      if (v != null && v !== '') o[k] = v;
    }
    return o;
  }

  /** À appeler avant de rouvrir IndexedDB restauré ; réinitialise la clé en mémoire. */
  function restoreLocalStorageFromBackup(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    for (const k of BACKUP_LS_KEYS) {
      if (Object.prototype.hasOwnProperty.call(snapshot, k) && snapshot[k] != null) {
        localStorage.setItem(k, String(snapshot[k]));
      }
    }
    memoryKey = null;
  }

  function isUnlocked() {
    return !!memoryKey;
  }

  async function encryptString(plainText) {
    if (!memoryKey) throw new Error('Coffre verrouillé — attendre initialisation ou recharger la page.');
    const iv = randomBytes(12);
    const enc = new TextEncoder();
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, memoryKey, enc.encode(plainText));
    return {
      iv: bytesToB64(iv.buffer),
      ciphertext: bytesToB64(cipherBuf)
    };
  }

  async function decryptString(payload) {
    if (!memoryKey) throw new Error('Coffre verrouillé');
    const iv = b64ToBytes(payload.iv);
    const raw = b64ToBytes(payload.ciphertext);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, memoryKey, raw);
    return new TextDecoder().decode(plainBuf);
  }

   
  global.InvooCryptoVault = {
    unlockVault,
    ensureUnlockedForDevice,
    lockVault,
    isUnlocked,
    encryptString,
    decryptString,
    snapshotLocalStorageForBackup,
    restoreLocalStorageFromBackup,
    /** Permet de réinitialiser le sel (après export sauvegarde) — cas rare */
    resetSaltForTesting() {
      localStorage.removeItem(LS_VAULT_SALT);
    }
  };
})(typeof window !== 'undefined' ? window : self);
