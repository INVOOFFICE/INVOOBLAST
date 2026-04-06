/**
 * Worker INVOOBLAST : POST /send → Resend API.
 * Clés : RESEND_API_KEY (secret), RESEND_FROM (expéditeur vérifié chez Resend).
 *
 * Corps JSON attendu : { to, subject, html, text? }
 */
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname.replace(/\/$/, '') === '/health') {
      return json(200, { ok: true, service: 'invooblast-cloud-worker' }, cors);
    }

    if (request.method === 'POST' && url.pathname.replace(/\/$/, '') === '/send') {
      const key = env.RESEND_API_KEY;
      const from = env.RESEND_FROM;
      if (!key || !from) {
        return json(500, { ok: false, error: 'Worker mis configuré (RESEND_API_KEY / RESEND_FROM).' }, cors);
      }

      let body;
      try {
        body = await request.json();
      } catch (_) {
        return json(400, { ok: false, error: 'JSON invalide.' }, cors);
      }

      const to = String(body.to || '').trim();
      const subject = String(body.subject || '').trim();
      const html = String(body.html || '');
      const text = body.text != null ? String(body.text).trim() : '';

      if (!to || !subject || !html) {
        return json(400, { ok: false, error: 'Champs requis : to, subject, html.' }, cors);
      }

      const resendPayload = {
        from,
        to: [to],
        subject,
        html
      };
      if (text) resendPayload.text = text;

      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resendPayload)
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        const err = j.message || j.error || `Resend HTTP ${r.status}`;
        return json(502, { ok: false, error: err }, cors);
      }

      return json(200, { ok: true, id: j.id || null }, cors);
    }

    return new Response('Not found', { status: 404, headers: cors });
  }
};

function json(status, obj, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors }
  });
}
