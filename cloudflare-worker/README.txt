INVOOBLAST — Worker Cloudflare (envoi via Resend)
==================================================

Prérequis : compte Cloudflare + compte Resend (domaine ou e-mail de test vérifié).

1. cd cloudflare-worker
2. npx wrangler login
3. wrangler secret put RESEND_API_KEY   (clé API Resend, jamais dans le dépôt)
4. Dans wrangler.toml, décommentez [vars] et définissez RESEND_FROM, ex. :
   "INVOOBLAST <onboarding@resend.dev>"
5. npx wrangler deploy

Routes exposées :
- GET  /health  → { "ok": true, ... }
- POST /send    → JSON { "to", "subject", "html", "text?" }

L’app INVOOBLAST (Paramètres → Mode d’envoi → Cloud) attend l’URL de base du Worker,
sans /send (ex. https://invooblast-send.xxx.workers.dev).
