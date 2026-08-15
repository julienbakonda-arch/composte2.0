# compostage2.0 — scaffold initial

Fichiers clés créés :

- `index.html` — page d'accueil
- `assets/css/style.css` — styles (variables couleurs)
- `assets/js/main.js` — init Leaflet + fetch
- `manifest.json`, `sw.js` — PWA
- `config/db.php` — config MySQL (modifiez pour XAMPP)
- `config/api_keys.php` — placez-y vos clés API (AI, Maps)
 - `config/api_keys.php` — placez-y vos clés API (AI, Maps). Exemple :

```php
return [
	'AI_API_KEY' => 'VOTRE_CLE_GEMINI_OU_EQUIVALENT',
	'MAPS_API_KEY' => '',
	'GROQ_API_KEY' => '',
	'SUPABASE_KEY' => '',
];
```
Note: l'application fonctionne avec MySQL local (XAMPP) et n'a pas besoin de Supabase. Si vous n'utilisez que MySQL local, laissez `SUPABASE_KEY` vide.
- `api/init_db.php` — crée la DB et tables si manquantes
- `api/hosts.php` — endpoint de test

Ouvrir dans XAMPP : placez le dossier `compostage2.0` dans `htdocs` (déjà fait).

Visitez `http://localhost/compostage2.0/`.

Initialiser la base : visitez

```
http://localhost/compostage2.0/api/init_db.php
```

Si vous avez changé le port MySQL (XAMPP), ouvrez `config/db.php` et modifiez la clé `port` (ex: `3307`). Exemple :

```php
return [
	'host' => '127.0.0.1',
	'user' => 'root',
	'pass' => '',
	'name' => 'compostage_db',
	'port' => 3307,
];
```

Ensuite relancez :

```
http://localhost/compostage2.0/api/test_db.php
```
pour vérifier la connexion.

La carte est centrée par défaut sur le Burundi (demande spécifique). Les utilisateurs peuvent partager leur position via le bouton "Ma position" et les hôtes peuvent s'enregistrer en utilisant la géolocalisation.

Comptes par défaut :

- **Admin** : email `admin@localhost`, mot de passe `admin123` (crée automatiquement par `api/init_db.php`).

Vous pouvez créer un compte hôte via la page de connexion : `http://localhost/compostage2.0/login.html`.

Remplir les clés : éditez `config/api_keys.php` et `config/db.php`.

Design : j'ai ajouté des variables CSS dans `assets/css/style.css`.
Pour adapter précisément au `screen.png`, veuillez fournir l'image; j'ajusterai les couleurs et les formes des boutons (actuellement `border-radius: 0`).
