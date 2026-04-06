/**
 * Relais HTTP → SMTP Gmail pour INVOOBLAST.
 * Local : 127.0.0.1. Déploiement : définir INVOOBLAST_SMTP_RELAY_HOST=0.0.0.0 + HTTPS devant (Render, Fly.io, etc.).
 */
import http from 'node:http';
import nodemailer from 'nodemailer';
import { scanInboxForBounces } from './bounce-scan.mjs';

/** Render / Fly / Docker injectent souvent PORT ; local : 18765. */
const PORT = Number(process.env.PORT || process.env.INVOOBLAST_SMTP_RELAY_PORT || 18765);
const HOST =
  process.env.INVOOBLAST_SMTP_RELAY_HOST ||
  (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const API_KEY = String(process.env.INVOOBLAST_RELAY_API_KEY || '').trim();

const ALLOWED_ORIGINS = process.env.INVOOBLAST_ALLOWED_ORIGINS
  ? process.env.INVOOBLAST_ALLOWED_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

function corsHeaders(requestOrigin) {
  const h = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-INVOOBLAST-KEY, Authorization',
    'Access-Control-Max-Age': '86400'
  };
  if (!ALLOWED_ORIGINS || ALLOWED_ORIGINS.length === 0) {
    h['Access-Control-Allow-Origin'] = '*';
    return h;
  }
  const o = requestOrigin || '';
  if (o && ALLOWED_ORIGINS.includes(o)) {
    h['Access-Control-Allow-Origin'] = o;
    h['Vary'] = 'Origin';
  }
  return h;
}

function originAllowed(requestOrigin) {
  if (!ALLOWED_ORIGINS || ALLOWED_ORIGINS.length === 0) return true;
  const o = requestOrigin || '';
  if (!o) return true;
  return ALLOWED_ORIGINS.includes(o);
}

function apiKeyOk(req) {
  if (!API_KEY) return true;
  const x = String(req.headers['x-invooblast-key'] || '').trim();
  const auth = String(req.headers['authorization'] || '');
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  return x === API_KEY || bearer === API_KEY;
}

function sendJson(res, status, body, requestOrigin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders(requestOrigin)
  };
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/** Extrait un texte lisible pour multipart/alternative (approximatif). */
function htmlToPlainText(html) {
  let s = String(html || '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(p|div|tr|h[1-6]|li|table|thead|tbody)>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/\u00a0/g, ' ');
  s = s.replace(/&nbsp;/gi, ' ');
  s = s.replace(/&amp;/gi, '&');
  s = s.replace(/&lt;/gi, '<');
  s = s.replace(/&gt;/gi, '>');
  s = s.replace(/&quot;/gi, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/[ \t]+\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim() || '—';
}

function createGmailTransport(auth) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: auth.user,
      pass: String(auth.pass || '').replace(/\s/g, '')
    }
  });
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';

  if (req.method === 'OPTIONS') {
    if (!originAllowed(origin)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Origin not allowed');
      return;
    }
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  if (!originAllowed(origin) && origin) {
    sendJson(res, 403, { ok: false, error: 'Origin CORS non autorisée' }, origin);
    return;
  }

  const url = new URL(req.url || '/', `http://${HOST}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    if (!apiKeyOk(req)) {
      sendJson(res, 401, { ok: false, error: 'Clé API requise (X-INVOOBLAST-KEY)' }, origin);
      return;
    }
    sendJson(res, 200, { ok: true, service: 'invooblast-smtp-relay' }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/scan-bounces') {
    if (!apiKeyOk(req)) {
      sendJson(res, 401, { ok: false, error: 'Clé API requise (X-INVOOBLAST-KEY)' }, origin);
      return;
    }
    let body;
    try {
      body = await readBody(req);
    } catch (_) {
      sendJson(res, 400, { ok: false, error: 'JSON invalide' }, origin);
      return;
    }
    const auth = body.auth;
    if (!auth || !auth.user || !auth.pass) {
      sendJson(res, 400, { ok: false, error: 'auth.user et auth.pass requis' }, origin);
      return;
    }
    try {
      const result = await scanInboxForBounces(auth, {
        days: body.days,
        maxMessages: body.maxMessages
      });
      sendJson(res, 200, { ok: true, ...result }, origin);
    } catch (e) {
      const msg = e && e.message ? String(e.message) : 'Erreur IMAP';
      sendJson(res, 502, { ok: false, error: msg }, origin);
    }
    return;
  }

  if (req.method !== 'POST' || url.pathname !== '/send') {
    sendJson(res, 404, { ok: false, error: 'Not found' }, origin);
    return;
  }

  if (!apiKeyOk(req)) {
    sendJson(res, 401, { ok: false, error: 'Clé API requise (X-INVOOBLAST-KEY)' }, origin);
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch (_) {
    sendJson(res, 400, { ok: false, error: 'JSON invalide' }, origin);
    return;
  }

  const auth = body.auth;
  const from = String(body.from || '').trim();
  const to = String(body.to || '').trim();
  const subject = String(body.subject || '');
  const html = String(body.html || '');
  const replyTo = body.replyTo ? String(body.replyTo).trim() : '';
  const listUnsubscribeHeader = !!body.listUnsubscribeHeader;
  const plainTextAlternative = !!body.plainTextAlternative;

  if (!auth || !auth.user || !auth.pass) {
    sendJson(res, 400, { ok: false, error: 'auth.user et auth.pass requis' }, origin);
    return;
  }
  if (!from || !to) {
    sendJson(res, 400, { ok: false, error: 'from et to requis' }, origin);
    return;
  }

  try {
    const transport = createGmailTransport(auth);
    const mail = {
      from,
      to,
      subject,
      html
    };
    if (replyTo) mail.replyTo = replyTo;
    if (plainTextAlternative) {
      mail.text = htmlToPlainText(html);
    }
    if (listUnsubscribeHeader) {
      const subj = encodeURIComponent('Unsubscribe');
      mail.headers = {
        'List-Unsubscribe': `<mailto:${from}?subject=${subj}>`
      };
    }
    const info = await transport.sendMail(mail);
    sendJson(
      res,
      200,
      {
        ok: true,
        messageId: info.messageId || null,
        accepted: info.accepted || [],
        rejected: info.rejected || []
      },
      origin
    );
  } catch (e) {
    const msg = e && e.message ? String(e.message) : 'Erreur SMTP';
    sendJson(res, 502, { ok: false, error: msg }, origin);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[INVOOBLAST] Relais SMTP à l'écoute sur ${HOST}:${PORT}`);
  if (HOST === '0.0.0.0') {
    console.log('[INVOOBLAST] Toutes interfaces ; en prod utilisez l’URL HTTPS de l’hébergeur (Render, etc.).');
  }
  console.log(`[INVOOBLAST] GET /health  POST /send  POST /scan-bounces (IMAP bounces)`);
  if (API_KEY) console.log('[INVOOBLAST] Clé API : activée (X-INVOOBLAST-KEY)');
  if (ALLOWED_ORIGINS && ALLOWED_ORIGINS.length) {
    console.log('[INVOOBLAST] CORS restreint :', ALLOWED_ORIGINS.join(', '));
  }
});
