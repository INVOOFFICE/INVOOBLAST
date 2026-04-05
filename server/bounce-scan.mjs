/**
 * Scan IMAP Gmail : rebonds (DSN) dans INBOX et dans Spam ([Gmail]/Spam ou Spam).
 * « Tous les messages » est volontairement exclu (volume et redondance).
 */
import { ImapFlow } from 'imapflow';

function normalizeAddr(s) {
  if (!s) return '';
  const t = String(s).trim().replace(/^<|>$/g, '');
  const m = t.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return m ? m[1].toLowerCase() : '';
}

/** @param {string} text */
export function extractBounceRecipientsFromRaw(text) {
  const out = new Set();
  const unfolded = String(text).replace(/\r\n[ \t]+/g, ' ');

  const patterns = [
    /\bX-Failed-Recipients:\s*([^\s<>]+@[^\s<>]+)/gi,
    /\bFinal-Recipient:\s*(?:rfc822;\s*)?([^\s<>]+@[^\s<>]+)/gi,
    /\bOriginal-Recipient:\s*(?:rfc822;\s*)?([^\s<>]+@[^\s<>]+)/gi,
    /\bAction:\s*failed\b[\s\S]{0,800}?\bFinal-Recipient:\s*(?:rfc822;\s*)?([^\s<>]+@[^\s<>]+)/gi
  ];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(unfolded))) {
      const a = normalizeAddr(m[1]);
      if (a) out.add(a);
    }
  }

  const i = unfolded.search(/\r?\n\r?\n/);
  const body = i >= 0 ? unfolded.slice(i) : unfolded;
  const deli =
    /(?:wasn't delivered to|not delivered to|n'a pas été livré|could not be delivered|Address not found)[^\n@]{0,120}([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  let m;
  while ((m = deli.exec(body))) {
    const a = normalizeAddr(m[1]);
    if (a) out.add(a);
  }

  return [...out];
}

function asUidList(v) {
  if (v === false || v == null) return [];
  return Array.isArray(v) ? v : [];
}

/**
 * @param {import('imapflow').ImapFlow} client
 * @param {number} days
 */
async function searchBounceUids(client, days) {
  try {
    const r = await client.search(
      {
        gmraw: `newer_than:${days}d (from:mailer-daemon OR from:postmaster OR subject:(undelivered OR failure OR "delivery status") OR "Delivery Status Notification")`
      },
      { uid: true }
    );
    return asUidList(r);
  } catch (_) {
    const since = new Date(Date.now() - days * 86400000);
    const a = asUidList(await client.search({ since, from: 'mailer-daemon' }, { uid: true }));
    const b = asUidList(await client.search({ since, from: 'postmaster' }, { uid: true }));
    const c = asUidList(await client.search({ since, subject: 'Undelivered' }, { uid: true }));
    return [...new Set([...a, ...b, ...c])].sort((x, y) => x - y);
  }
}

/**
 * @param {import('imapflow').ImapFlow} client
 * @param {string} folderPath
 * @param {number} days
 * @param {number} maxSlice
 * @param {string} userLower
 * @param {Set<string>} allRecipients
 */
async function scanOneFolder(client, folderPath, days, maxSlice, userLower, allRecipients) {
  let lock;
  try {
    lock = await client.getMailboxLock(folderPath);
  } catch (e) {
    return {
      path: folderPath,
      skipped: true,
      uidMatched: 0,
      messagesFetched: 0,
      reason: e && e.message ? String(e.message) : 'dossier indisponible'
    };
  }

  try {
    let uidList = await searchBounceUids(client, days);
    uidList = [...new Set(uidList)].sort((a, b) => a - b);
    const uidMatched = uidList.length;
    if (uidList.length > maxSlice) {
      uidList = uidList.slice(-maxSlice);
    }

    let messagesFetched = 0;
    if (!uidList.length) {
      return { path: folderPath, uidMatched, messagesFetched: 0, skipped: false };
    }

    for await (const msg of client.fetch(uidList, { source: true, uid: true }, { uid: true })) {
      messagesFetched++;
      if (!msg.source) continue;
      const raw = msg.source.toString('utf8');
      for (const em of extractBounceRecipientsFromRaw(raw)) {
        if (em && em !== userLower) allRecipients.add(em);
      }
    }
    return { path: folderPath, uidMatched, messagesFetched, skipped: false };
  } finally {
    lock.release();
  }
}

/**
 * @param {{ user: string, pass: string }} auth
 * @param {{ days?: number, maxMessages?: number }} opts
 */
export async function scanInboxForBounces(auth, opts) {
  const days = Math.min(90, Math.max(1, Number(opts.days) || 30));
  const maxMessages = Math.min(500, Math.max(10, Number(opts.maxMessages) || 200));
  const pass = String(auth.pass || '').replace(/\s/g, '');
  const user = String(auth.user || '').trim();
  if (!user || !pass) throw new Error('auth.user et auth.pass requis');

  const userLower = user.toLowerCase();
  const perFolder = Math.max(5, Math.ceil(maxMessages / 2));

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false
  });

  const allRecipients = new Set();
  const folderResults = [];

  try {
    await client.connect();

    const inbox = await scanOneFolder(client, 'INBOX', days, perFolder, userLower, allRecipients);
    folderResults.push(inbox);
    if (inbox.skipped) {
      throw new Error(`Boîte de réception inaccessible : ${inbox.reason || ''}`);
    }

    let spamResult = await scanOneFolder(client, '[Gmail]/Spam', days, perFolder, userLower, allRecipients);
    if (spamResult.skipped) {
      spamResult = await scanOneFolder(client, 'Spam', days, perFolder, userLower, allRecipients);
    }
    folderResults.push(spamResult);
  } finally {
    try {
      await client.logout();
    } catch (_) {}
  }

  const totalUidMatched = folderResults.reduce((s, f) => s + (f.uidMatched || 0), 0);
  const totalMessagesFetched = folderResults.reduce((s, f) => s + (f.messagesFetched || 0), 0);

  return {
    account: user,
    uidMatched: totalUidMatched,
    messagesFetched: totalMessagesFetched,
    failedRecipients: [...allRecipients].sort(),
    folders: folderResults
  };
}
