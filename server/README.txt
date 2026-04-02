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
  • GET  /health  — état du relais
  • POST /send    — JSON : auth { user, pass }, from, to, subject, html [, replyTo ]

Variables d’environnement (optionnelles) :
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

GitHub Pages + envoi d’e-mails (résumé) :
  • GitHub Pages ne fait tourner que des fichiers statiques : pas de Node.js.
  • Hébergez ce dossier server/ sur un service qui exécute Node (Render, Fly.io,
    Railway, VPS…) avec HTTPS.
  • Dans l’app (Paramètres), URL du relais = l’URL https:// fournie par ce service.
  • Définissez INVOOBLAST_ALLOWED_ORIGINS avec l’URL exacte de votre site GitHub Pages.
  • Définissez INVOOBLAST_RELAY_API_KEY et la même clé dans l’app.
  • Les boîtes Gmail restent configurées dans l’app (pool) comme en local ; les
    mots de passe d’application ne sont pas stockés sur GitHub, ils restent dans
    le navigateur (IndexedDB chiffré).
