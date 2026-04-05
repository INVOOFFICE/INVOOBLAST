/**
 * Client HTTP vers le relais SMTP (server/smtp-relay.mjs) — local ou déployé (HTTPS).
 */
(function (global) {
  'use strict';

  const DEFAULT_RELAY_PORT = '18765';

  function normalizeBaseUrl(raw) {
    let s = String(raw || '').trim();
    if (!s) s = 'http://127.0.0.1:' + DEFAULT_RELAY_PORT;
    s = s.replace(/\/+$/, '');
    try {
      const u = new URL(s);
      const h = (u.hostname || '').toLowerCase();
      if ((h === '127.0.0.1' || h === 'localhost') && u.port === '1876') {
        u.port = DEFAULT_RELAY_PORT;
        s = u.toString().replace(/\/+$/, '');
      }
    } catch (_) {}
    return s;
  }

  function relayHeaders(apiKey, jsonBody) {
    const h = {};
    if (jsonBody) h['Content-Type'] = 'application/json';
    const k = apiKey != null ? String(apiKey).trim() : '';
    if (k) h['X-INVOOBLAST-KEY'] = k;
    return h;
  }

  /** Page HTTPS ne peut pas appeler un relais http:// (sauf cas particuliers). */
  function mixedContentBlocksFetch(relayUrl) {
    try {
      const loc = global.location;
      if (!loc || loc.protocol !== 'https:') return false;
      const r = new URL(normalizeBaseUrl(relayUrl));
      return r.protocol === 'http:';
    } catch (_) {
      return false;
    }
  }

  /** localhost et 127.0.0.1 : on essaie les deux. */
  function relayUrlCandidates(primary) {
    const norm = normalizeBaseUrl(primary);
    const list = [norm];
    try {
      const u = new URL(norm);
      if (u.hostname === '127.0.0.1') {
        u.hostname = 'localhost';
        list.push(u.toString().replace(/\/+$/, ''));
      } else if (u.hostname.toLowerCase() === 'localhost') {
        u.hostname = '127.0.0.1';
        list.push(u.toString().replace(/\/+$/, ''));
      }
    } catch (_) {}
    return [...new Set(list)];
  }

  async function tryHealthOnce(base, apiKey) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(`${base}/health`, {
        signal: ctrl.signal,
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        headers: relayHeaders(apiKey, false)
      });
      if (r.status === 401) return { ok: false, reason: 'clé API refusée (401)' };
      if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
      const j = await r.json().catch(() => ({}));
      if (!j.ok) return { ok: false, reason: 'réponse inattendue' };
      return { ok: true, base };
    } finally {
      clearTimeout(t);
    }
  }

  /**
   * @param {string} [apiKey]
   * @returns {Promise<{ ok: boolean, message: string, resolvedBase?: string }>}
   */
  async function relayHealth(baseUrl, apiKey) {
    if (mixedContentBlocksFetch(baseUrl)) {
      return {
        ok: false,
        message:
<<<<<<< HEAD
          'Cette page est en HTTPS : le navigateur bloque un relais en http://. Déployez le relais derrière HTTPS (Render, Fly.io, etc.) et mettez son URL https:// dans Paramètres, ou ouvrez l’app en http://localhost pour le relais local.'
=======
          'Site en HTTPS (ex. GitHub Pages) + relais en http:// : le navigateur bloque ce mélange (sécurité). Deux possibilités : (1) Déployer le dossier server/ en HTTPS (Render, Fly.io, voir render.yaml) et mettre son URL https:// dans Paramètres. (2) Utiliser le relais local uniquement en ouvrant l’app en http://localhost sur votre PC (npx serve dans le clone du repo), pas via github.io.'
>>>>>>> 7f4f399 (ok)
      };
    }

    const bases = relayUrlCandidates(baseUrl);
    let lastReason = '';

    for (const base of bases) {
      try {
        const r = await tryHealthOnce(base, apiKey);
        if (r.ok) {
          const hint = base !== normalizeBaseUrl(baseUrl) ? ` (joignable via ${base})` : '';
          return {
            ok: true,
            message: `Relais joignable${hint}`,
            resolvedBase: r.base
          };
        }
        lastReason = r.reason || '';
      } catch (e) {
        const name = e && e.name;
        if (name === 'AbortError') {
          lastReason = 'délai dépassé';
        } else {
          const msg = e && e.message ? String(e.message) : '';
          lastReason = msg || 'réseau';
        }
      }
    }

    const tried = bases.join(' ou ');
    let msg =
      `Relais injoignable (${tried}). Vérifiez l’URL, le port, que le serveur tourne, et la clé API si le relais en exige une.`;
    if (lastReason) msg += ` Détail : ${lastReason}.`;
    return { ok: false, message: msg };
  }

  /**
   * @param {string} baseUrl
   * @param {object} payload
   * @param {string} [apiKey]
   */
  async function relaySendMail(baseUrl, payload, apiKey) {
    const bases = relayUrlCandidates(baseUrl);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 120000);
    let lastErr = null;
    try {
      for (const base of bases) {
        try {
          const r = await fetch(`${base}/send`, {
            method: 'POST',
            headers: relayHeaders(apiKey, true),
            signal: ctrl.signal,
            mode: 'cors',
            cache: 'no-store',
            body: JSON.stringify(payload)
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.ok) {
            throw new Error((j && j.error) || `HTTP ${r.status}`);
          }
          return { messageId: j.messageId || null };
        } catch (e) {
          lastErr = e;
          const name = e && e.name;
          const msg = e && e.message ? String(e.message) : '';
          const isNetworkLayer =
            name === 'TypeError' ||
            name === 'AbortError' ||
            /Failed to fetch|NetworkError|Load failed|network/i.test(msg);
          if (!isNetworkLayer) throw e;
        }
      }
      throw lastErr || new Error('Échec envoi relais');
    } finally {
      clearTimeout(t);
    }
  }

<<<<<<< HEAD
=======
  /**
   * Scan IMAP rebonds (relais Node — POST /scan-bounces).
   * @param {string} baseUrl
   * @param {{ auth: { user: string, pass: string }, days?: number, maxMessages?: number }} payload
   * @param {string} [apiKey]
   * @returns {Promise<{ ok: boolean, account?: string, uidMatched?: number, messagesFetched?: number, failedRecipients?: string[], error?: string }>}
   */
  async function relayScanBounces(baseUrl, payload, apiKey) {
    const bases = relayUrlCandidates(baseUrl);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 180000);
    let lastErr = null;
    try {
      for (const base of bases) {
        try {
          const r = await fetch(`${base}/scan-bounces`, {
            method: 'POST',
            headers: relayHeaders(apiKey, true),
            signal: ctrl.signal,
            mode: 'cors',
            cache: 'no-store',
            body: JSON.stringify(payload)
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.ok) {
            throw new Error((j && j.error) || `HTTP ${r.status}`);
          }
          return j;
        } catch (e) {
          lastErr = e;
          const name = e && e.name;
          const msg = e && e.message ? String(e.message) : '';
          const isNetworkLayer =
            name === 'TypeError' ||
            name === 'AbortError' ||
            /Failed to fetch|NetworkError|Load failed|network/i.test(msg);
          if (!isNetworkLayer) throw e;
        }
      }
      throw lastErr || new Error('Échec scan rebonds');
    } finally {
      clearTimeout(t);
    }
  }

>>>>>>> 7f4f399 (ok)
  global.InvooSmtpRelayClient = {
    normalizeBaseUrl,
    relayUrlCandidates,
    relayHealth,
    relaySendMail,
<<<<<<< HEAD
=======
    relayScanBounces,
>>>>>>> 7f4f399 (ok)
    relayHeaders
  };
})(typeof window !== 'undefined' ? window : self);
