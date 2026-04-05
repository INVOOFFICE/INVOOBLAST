# INVOOBLAST

PWA **offline-first** pour préparer et envoyer des campagnes e-mail : listes, éditeur HTML, pool Gmail (App Password chiffré localement), relais SMTP.

Les **données métier** restent dans le **navigateur** (IndexedDB). **Aucun** backend INVOOBLAST hébergé par ce dépôt pour stocker vos contacts ou mots de passe.

## Démarrage rapide (local)

1. Servir la racine du dépôt en HTTP statique, par exemple :

   ```bash
   npx --yes serve .
   ```

2. Ouvrir `http://localhost:3000` (ou le port indiqué) — redirection vers `app/index.html`.

3. Pour **envoyer** de vrais e-mails, lancer le relais Node :

   ```bash
   cd server
   npm install
   npm start
   ```

   Puis dans l’app : **Paramètres** → URL du relais `http://127.0.0.1:18765` (par défaut) et configurer le **pool Gmail**.

Sur Windows, vous pouvez utiliser `server/start-relay.bat`.

## GitHub Pages (interface seule)

Pages ne sert que les fichiers statiques en **HTTPS**. Un relais SMTP **local** (`http://127.0.0.1:18765`) **ne peut pas** être appelé depuis `github.io` : le navigateur bloque le contenu mixte (HTTPS → HTTP). Pour envoyer depuis le site publié, déployez le dossier **`server/`** derrière **HTTPS** ([Render Blueprint](./render.yaml), etc.) et mettez cette URL dans l’app — voir **[server/README.txt](./server/README.txt)**. Pour tester avec le relais sur votre PC, ouvrez le dépôt en local avec `npx serve` (**http://localhost**), pas seulement GitHub Pages.

## Structure utile

| Élément | Rôle |
|--------|------|
| `app/` | Interface PWA |
| `data/db.js` | IndexedDB |
| `server/` | Relais HTTP → SMTP Gmail (open source, même dépôt) |
| `APP-GUIDE.txt` | Notes d’architecture (dans le dépôt) |

## Licence

Voir le dépôt / auteur du projet pour les conditions d’utilisation.
