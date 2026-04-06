/**
 * Client HTTP vers le relais SMTP (server/smtp-relay.mjs) — local ou déployé (HTTPS).
 *
 * Gestion des cold starts (ex. Render gratuit) :
 * - Timeout long par tentative (70 s par défaut), AbortController standard.
 * - Nouvelles tentatives avec délai (backoff exponentiel) sur timeout / erreur réseau / 502–504.
 * - Événement window `invooblast:relay-waiting` (detail.message) pour afficher un toast sans échec brutal.
 *
 * Keep-alive (optionnel, hors code) : ping périodique sur GET /health (ex. toutes les 10 min) via
 * UptimeRobot, cron-job.org, ou GitHub Actions — limite la mise en veille du service gratuit.
 */
(function (global) {
  'use strict';

  const DEFAULT_RELAY_PORT = '18765';

  /** Délai max par tentative (≥ 60 s pour cold start Render). */
  const RELAY_PER_ATTEMPT_TIMEOUT_MS = 70000;

  /** Nombre de nouvelles tentatives après la 1re (total = 1 + maxRetries). */
  const RELAY_MAX_RETRIES = 3;

  const RELAY_RETRY_BASE_DELAY_MS = 2500;

  /** Message affiché entre les tentatives (cold start hébergeur gratuit). */
  const DEFAULT_WAITING_MESSAGE = 'Server waking up, please wait…';

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function emitRelayWaiting(message) {
    try {
      global.dispatchEvent(
        new CustomEvent('invooblast:relay-waiting', {
          detail: { message: message != null ? String(message) : DEFAULT_WAITING_MESSAGE }
        })
      );
    } catch (_) {}
  }

  function isRetriableHttpStatus(status) {
    return status === 502 || status === 503 || status === 504 || status === 408 || status === 429;
  }

  function isRetriableFetchError(e, externalSignal) {
    if (!e) return false;
    if (externalSignal && externalSignal.aborted) return false;
    const name = e.name;
    if (name === 'AbortError' || name === 'TimeoutError') return true;
    if (name === 'TypeError') return true;
    const msg = e.message ? String(e.message) : '';
    return /Failed to fetch|NetworkError|Load failed|network/i.test(msg);
  }

  /**
   * fetch avec timeout, fusion du signal externe (annulation utilisateur), et nouvelles tentatives.
   *
   * @param {string} url
   * @param {RequestInit} init
   * @param {{
   *   timeoutMs?: number,
   *   maxRetries?: number,
   *   retryDelayMs?: number,
   *   signal?: AbortSignal,
   *   onStatus?: (msg: string) => void,
   *   waitingMessage?: string
   * }} [opts]
   * @returns {Promise<Response>}
   */
  async function fetchRelay(url, init, opts) {
    const timeoutMs =
      opts && opts.timeoutMs != null ? Number(opts.timeoutMs) : RELAY_PER_ATTEMPT_TIMEOUT_MS;
    const maxRetries =
      opts && opts.maxRetries != null ? Math.max(0, Number(opts.maxRetries)) : RELAY_MAX_RETRIES;
    const retryDelayBase =
      opts && opts.retryDelayMs != null
        ? Number(opts.retryDelayMs)
        : RELAY_RETRY_BASE_DELAY_MS;
    const externalSignal = opts && opts.signal;
    const onStatus = opts && typeof opts.onStatus === 'function' ? opts.onStatus : null;
    const waitingMsg =
      opts && opts.waitingMessage != null ? String(opts.waitingMessage) : DEFAULT_WAITING_MESSAGE;

    let lastErr = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (externalSignal && externalSignal.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }

      if (attempt > 0) {
        emitRelayWaiting(waitingMsg);
        if (onStatus) onStatus(waitingMsg);
        const backoff = retryDelayBase * Math.pow(2, attempt - 1);
        await sleep(backoff);
      }

      const controller = new AbortController();
      let timerId = setTimeout(() => controller.abort(), timeoutMs);

      const onExternalAbort = () => {
        clearTimeout(timerId);
        controller.abort();
      };

      if (externalSignal) {
        if (externalSignal.aborted) {
          clearTimeout(timerId);
          throw new DOMException('The operation was aborted.', 'AbortError');
        }
        externalSignal.addEventListener('abort', onExternalAbort);
      }

      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timerId);
        if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);

        if (!res.ok && isRetriableHttpStatus(res.status) && attempt < maxRetries) {
          try {
            if (res.body && typeof res.body.cancel === 'function') res.body.cancel();
          } catch (_) {}
          lastErr = new Error('HTTP ' + res.status);
          continue;
        }
        return res;
      } catch (e) {
        clearTimeout(timerId);
        if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);

        if (externalSignal && externalSignal.aborted) {
          throw new DOMException('The operation was aborted.', 'AbortError');
        }

        if (isRetriableFetchError(e, externalSignal) && attempt < maxRetries) {
          lastErr = e;
          continue;
        }
        throw e;
      }
    }

    throw lastErr || new Error('Échec après nouvelles tentatives');
  }

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

  /**
   * @param {object} [relayOpts] — transmis à fetchRelay (signal, onStatus, timeoutMs, …)
   */
  async function tryHealthOnce(base, apiKey, relayOpts) {
    try {
      const r = await fetchRelay(
        `${base}/health`,
        {
          method: 'GET',
          mode: 'cors',
          cache: 'no-store',
          headers: relayHeaders(apiKey, false)
        },
        relayOpts
      );
      if (r.status === 401) return { ok: false, reason: 'clé API refusée (401)' };
      if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
      const j = await r.json().catch(() => ({}));
      if (!j.ok) return { ok: false, reason: 'réponse inattendue' };
      return { ok: true, base };
    } catch (e) {
      const name = e && e.name;
      if (name === 'AbortError' && relayOpts && relayOpts.signal && relayOpts.signal.aborted) {
        return { ok: false, reason: 'annulé' };
      }
      if (name === 'AbortError') return { ok: false, reason: 'délai dépassé ou relais lent' };
      const msg = e && e.message ? String(e.message) : '';
      return { ok: false, reason: msg || 'réseau' };
    }
  }

  /**
   * @param {string} [apiKey]
   * @param {object} [relayOpts] — { signal?, onStatus?, waitingMessage?, timeoutMs?, maxRetries? }
   * @returns {Promise<{ ok: boolean, message: string, resolvedBase?: string }>}
   */
  async function relayHealth(baseUrl, apiKey, relayOpts) {
    if (mixedContentBlocksFetch(baseUrl)) {
      return {
        ok: false,
        message:
          'Site en HTTPS (ex. GitHub Pages) + relais en http:// : le navigateur bloque ce mélange (sécurité). Deux possibilités : (1) Déployer le dossier server/ en HTTPS (Render, Fly.io, voir render.yaml) et mettre son URL https:// dans Paramètres. (2) Utiliser le relais local uniquement en ouvrant l’app en http://localhost sur votre PC (npx serve dans le clone du repo), pas via github.io.'
      };
    }

    const bases = relayUrlCandidates(baseUrl);
    let lastReason = '';

    for (const base of bases) {
      const r = await tryHealthOnce(base, apiKey, relayOpts);
      if (r.ok) {
        const hint = base !== normalizeBaseUrl(baseUrl) ? ` (joignable via ${base})` : '';
        return {
          ok: true,
          message: `Relais joignable${hint}`,
          resolvedBase: r.base
        };
      }
      lastReason = r.reason || '';
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
   * @param {object} [relayOpts] — AbortSignal, onStatus, etc.
   */
  async function relaySendMail(baseUrl, payload, apiKey, relayOpts) {
    const bases = relayUrlCandidates(baseUrl);
    let lastErr = null;
    for (const base of bases) {
      try {
        const r = await fetchRelay(
          `${base}/send`,
          {
            method: 'POST',
            headers: relayHeaders(apiKey, true),
            mode: 'cors',
            cache: 'no-store',
            body: JSON.stringify(payload)
          },
          relayOpts
        );
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) {
          throw new Error((j && j.error) || `HTTP ${r.status}`);
        }
        return { messageId: j.messageId || null };
      } catch (e) {
        lastErr = e;
        const name = e && e.name;
        if (name === 'AbortError' && relayOpts && relayOpts.signal && relayOpts.signal.aborted) {
          throw e;
        }
        const msg = e && e.message ? String(e.message) : '';
        const isNetworkLayer =
          name === 'TypeError' ||
          name === 'AbortError' ||
          /Failed to fetch|NetworkError|Load failed|network/i.test(msg);
        if (!isNetworkLayer) throw e;
      }
    }
    throw lastErr || new Error('Échec envoi relais');
  }

  /**
   * Scan IMAP rebonds (relais Node — POST /scan-bounces).
   * @param {string} baseUrl
   * @param {{ auth: { user: string, pass: string }, days?: number, maxMessages?: number }} payload
   * @param {string} [apiKey]
   * @param {object} [relayOpts]
   * @returns {Promise<{ ok: boolean, account?: string, uidMatched?: number, messagesFetched?: number, failedRecipients?: string[], error?: string }>}
   */
  async function relayScanBounces(baseUrl, payload, apiKey, relayOpts) {
    const scanOpts = {
      timeoutMs: 120000,
      maxRetries: RELAY_MAX_RETRIES,
      ...relayOpts
    };
    const bases = relayUrlCandidates(baseUrl);
    let lastErr = null;
    for (const base of bases) {
      try {
        const r = await fetchRelay(
          `${base}/scan-bounces`,
          {
            method: 'POST',
            headers: relayHeaders(apiKey, true),
            mode: 'cors',
            cache: 'no-store',
            body: JSON.stringify(payload)
          },
          scanOpts
        );
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) {
          throw new Error((j && j.error) || `HTTP ${r.status}`);
        }
        return j;
      } catch (e) {
        lastErr = e;
        const name = e && e.name;
        if (name === 'AbortError' && relayOpts && relayOpts.signal && relayOpts.signal.aborted) {
          throw e;
        }
        const msg = e && e.message ? String(e.message) : '';
        const isNetworkLayer =
          name === 'TypeError' ||
          name === 'AbortError' ||
          /Failed to fetch|NetworkError|Load failed|network/i.test(msg);
        if (!isNetworkLayer) throw e;
      }
    }
    throw lastErr || new Error('Échec scan rebonds');
  }

  global.InvooSmtpRelayClient = {
    normalizeBaseUrl,
    relayUrlCandidates,
    relayHealth,
    relaySendMail,
    relayScanBounces,
    relayHeaders,
    fetchRelay,
    RELAY_PER_ATTEMPT_TIMEOUT_MS,
    RELAY_MAX_RETRIES,
    RELAY_RETRY_BASE_DELAY_MS,
    DEFAULT_WAITING_MESSAGE
  };
})(typeof window !== 'undefined' ? window : self);
