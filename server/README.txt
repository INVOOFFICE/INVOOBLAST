INVOOBLAST — relais SMTP (Node)
================================

Le navigateur ne peut pas ouvrir SMTP directement. Ce service reçoit les
requêtes HTTP et envoie via smtp.gmail.com (identifiants fournis par l’app).

Installation (une fois) :
  cd server
  npm install

Démarrage local :
  npm start

Par défaut : http://127.0.0.1:18765
  • GET  /health           — état du relais
  • POST /send             — JSON : auth { user, pass }, from, to, subject, html [, replyTo ]
  • POST /scan-bounces     — JSON : auth { user, pass } [, days, maxMessages ]
                          IMAP Gmail : lecture INBOX + Spam, recherche DSN / rebonds récents,
                          renvoie { failedRecipients, folders: [ { path, uidMatched, messagesFetched } ] }.
                          Page « IMAP & bounces » (pool Gmail).

Variables d’environnement (optionnelles) :
  PORT
    — défini automatiquement sur Render, Fly, Railway, etc. (prioritaire sur le port).
  INVOOBLAST_SMTP_RELAY_PORT=18765
  INVOOBLAST_SMTP_RELAY_HOST=127.0.0.1
    — en déploiement cloud, utiliser souvent 0.0.0.0 pour écouter toutes les interfaces.

  INVOOBLAST_RELAY_API_KEY=votre_secret
    — si défini, chaque requête doit envoyer l’en-tête :
      X-INVOOBLAST-KEY: votre_secret
    — renseignez la même valeur dans l’app : Paramètres → Clé API relais.

  INVOOBLAST_ALLOWED_ORIGINS=https://votrecompte.github.io,https://www.votredomaine.com
    — liste d’origines autorisées (CORS). Si vide, tout origine acceptée (*).
    — Pour GitHub Pages : mettez l’URL exacte du site, ex. :
      https://monuser.github.io
      ou https://monuser.github.io/nom-du-repo
    (vérifiez l’URL dans la barre du navigateur une fois le site publié.)

Sécurité (local) :
  Par défaut le relais n’écoute que sur 127.0.0.1. Les secrets Gmail transitent
  entre le navigateur et ce processus : ne pas exposer le port sur Internet sans
  HTTPS, clé API et CORS stricts.

Déploiement open source (même code que le local) :
  • Dockerfile : dans server/ — image Node alpine, prête pour Docker / Kubernetes.
  • render.yaml : à la racine du dépôt — Blueprint Render.com (New > Blueprint).
    Après build, copier l’URL https://… du service et la coller dans l’app
    (Paramètres → URL du relais). Renseigner INVOOBLAST_ALLOWED_ORIGINS dans le
    tableau de bord Render avec l’URL exacte de votre site GitHub Pages.
  • Toute autre plateforme Node (Fly.io, Railway, VPS + Caddy/HTTPS) : même
    principe — variables PORT, INVOOBLAST_SMTP_RELAY_HOST=0.0.0.0, CORS, clé API.

GitHub Pages + envoi d’e-mails (résumé) :
  • Depuis le site en HTTPS (github.io), le navigateur interdit d’appeler un relais
    http://127.0.0.1 sur votre PC (contenu mixte). Utilisez un relais déployé en
    https:// ou ouvrez l’app en local (http://localhost) avec le relais npm start.
  • GitHub Pages ne fait tourner que des fichiers statiques : pas de Node.js.
  • L’interface INVOOBLAST sur Pages + le dossier server/ déployé ailleurs = outil
    prêt : vous ne configurez dans l’UI que les boîtes Gmail (e-mail + App Password),
    le brouillon, les listes — comme en local. Le relais HTTPS fait le pont vers SMTP.
  • Dans l’app (Paramètres), URL du relais = l’URL https:// du service (sans /send).
  • Définissez INVOOBLAST_ALLOWED_ORIGINS avec l’URL exacte de votre site GitHub Pages.
  • Définissez INVOOBLAST_RELAY_API_KEY et la même clé dans l’app (Paramètres).
  • Les mots de passe d’application ne sont pas sur GitHub : IndexedDB chiffré dans
    le navigateur de chaque utilisateur.
