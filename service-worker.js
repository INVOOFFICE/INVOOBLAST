/**
 * INVOOBLAST — Service Worker (offline-first shell)
 * Met en cache l’application statique ; les données utilisateur restent dans IndexedDB (hors Cache API).
 * Incrémenter CACHE_VERSION après tout changement d’assets précachés.
 */
const CACHE_VERSION = 'invooblast-v52';
const CACHE_NAME = `invooblast-static-${CACHE_VERSION}`;

/** Chemins relatifs à la racine du dépôt (servir depuis la racine, ex. npx serve .) */
const PRECACHE_ASSETS = [
  './index.html',
  './app/index.html',
  './manifest.json',
  './service-worker.js',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
  './app/css/tokens.css',
  './app/css/app.css',
  './data/db.js',
  './app/services/crypto-vault.js',
  './app/services/network-state.js',
  './app/services/gmail-account-store.js',
  './app/services/smtp-relay-client.js',
  './app/services/cloud-worker-client.js',
  './app/services/blast-send-engine.js',
  './app/services/email-merge.js',
  './app/vendor/xlsx.full.min.js',
  './app/components/shell.js',
  './app/js/confirm-dialog.js',
  './app/js/sw-register.js',
  './app/js/navigation.js',
  './app/js/lists-import.js',
  './app/js/dashboard.js',
  './app/js/email-editor.js',
  './app/js/settings.js',
  './app/js/imap-page.js',
  './app/js/blast.js',
  './app/js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const results = await Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn('[SW] precache miss', url, err);
            throw err;
          })
        )
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) {
        console.error('[SW] precache incomplete', failed.length, 'failures');
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

/** Ressources de l’app : stratégie cache d’abord, puis réseau */
function isStaticAppAsset(pathname) {
  return (
    pathname.endsWith('.html') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.json') ||
    pathname.includes('/app/') ||
    pathname.includes('/data/') ||
    pathname.includes('/icons/')
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !isSameOrigin(req)) return;

  const url = new URL(req.url);
  if (!isStaticAppAsset(url.pathname) && url.pathname !== '/' && url.pathname !== '') {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === 'basic') {
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        if (req.mode === 'navigate' || req.destination === 'document') {
          const fallback = await cache.match('./app/index.html');
          if (fallback) return fallback;
        }
        return new Response('Hors ligne — ressource non disponible en cache.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })()
  );
});
