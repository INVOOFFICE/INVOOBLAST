/**
 * Envoi e-mail via Cloudflare Worker (ex. Resend) — aucune clé API côté navigateur.
 * Le Worker expose POST /send et GET /health.
 */
(function (global) {
  'use strict';

  const DEFAULT_TIMEOUT_MS = 70000;
  const WORKER_WAITING_MSG = 'Server waking up, please wait…';

  function normalizeWorkerBaseUrl(raw) {
    return String(raw || '')
      .trim()
      .replace(/\/+$/, '');
  }

  function mixedContentBlocksWorker(workerUrl) {
    try {
      const loc = global.location;
      if (!loc || loc.protocol !== 'https:') return false;
      const r = new URL(normalizeWorkerBaseUrl(workerUrl));
      return r.protocol === 'http:';
    } catch (_) {
      return false;
    }
  }

  function getFetchRelay() {
    const c = global.InvooSmtpRelayClient;
    return c && typeof c.fetchRelay === 'function' ? c.fetchRelay : null;
  }

  function htmlToPlainApprox(html) {
    try {
      const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
      const t = doc.body ? doc.body.innerText : '';
      return String(t || '')
        .replace(/\s+/g, ' ')
        .trim();
    } catch (_) {
      return '';
    }
  }

  /**
   * @param {string} baseUrl — ex. https://xxx.workers.dev (sans /send)
   * @param {{ to: string, subject: string, html: string, text?: string }} payload
   * @param {object} [opts] — transmis à fetchRelay (signal, onStatus, timeoutMs, maxRetries, …)
   * @returns {Promise<object>}
   */
  async function sendViaWorker(baseUrl, payload, opts) {
    const fetchRelay = getFetchRelay();
    if (!fetchRelay) throw new Error('Relais injoignable');

    const base = normalizeWorkerBaseUrl(baseUrl);
    if (!base) throw new Error('URL du Worker non configurée.');

    const body = {
      to: String(payload.to || '').trim(),
      subject: String(payload.subject || ''),
      html: String(payload.html || '')
    };
    if (payload.text != null && String(payload.text).trim()) {
      body.text = String(payload.text).trim();
    }

    const relayOpts = {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      waitingMessage: WORKER_WAITING_MSG,
      ...opts
    };

    let r;
    try {
      r = await fetchRelay(
        `${base}/send`,
        {
          method: 'POST',
          mode: 'cors',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        },
        relayOpts
      );
    } catch (_) {
      throw new Error('Relais injoignable');
    }

    let j = {};
    try {
      j = await r.json();
    } catch (_) {}

    if (!r.ok || j.ok === false) {
      const detail = j.error || j.message || `HTTP ${r.status}`;
      throw new Error(`Relais injoignable (${detail})`);
    }

    return j;
  }

  /**
   * @param {string} baseUrl
   * @param {object} [relayOpts]
   * @returns {Promise<{ ok: boolean, message: string, resolvedBase?: string }>}
   */
  async function workerHealth(baseUrl, relayOpts) {
    if (mixedContentBlocksWorker(baseUrl)) {
      return {
        ok: false,
        message:
          'Site en HTTPS : le Worker doit être en https:// (pas en http://).'
      };
    }

    const fetchRelay = getFetchRelay();
    if (!fetchRelay) {
      return { ok: false, message: 'Relais injoignable' };
    }

    const base = normalizeWorkerBaseUrl(baseUrl);
    if (!base) {
      return { ok: false, message: 'Indiquez l’URL de base du Worker (Paramètres).' };
    }

    const mergedOpts = {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      waitingMessage: WORKER_WAITING_MSG,
      ...relayOpts
    };

    try {
      const r = await fetchRelay(
        `${base}/health`,
        { method: 'GET', mode: 'cors', cache: 'no-store' },
        mergedOpts
      );
      if (!r.ok) return { ok: false, message: 'Relais injoignable' };
      const j = await r.json().catch(() => ({}));
      if (!j.ok) return { ok: false, message: 'Relais injoignable' };
      return { ok: true, message: 'Worker joignable', resolvedBase: base };
    } catch (_) {
      return { ok: false, message: 'Relais injoignable' };
    }
  }

  global.InvooCloudWorkerClient = {
    normalizeWorkerBaseUrl,
    sendViaWorker,
    workerHealth,
    htmlToPlainApprox,
    DEFAULT_TIMEOUT_MS
  };
})(typeof window !== 'undefined' ? window : self);
