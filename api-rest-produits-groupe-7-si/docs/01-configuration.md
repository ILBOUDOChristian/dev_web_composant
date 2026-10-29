# 1. Configuration

Cette étape prépare les variables utilisées par Docker Compose, le backend
Python et WSO2.

## Fichiers essentiels

- `.env` : configuration locale effective ; ne pas partager ce fichier.
- `.env.example` : modèle des variables attendues, sans secret réel.
- `.gitignore` : exclut les secrets, environnements virtuels et artefacts.

## Ports utilisés

```text
PostgreSQL : localhost:5434 -> db:5432
API Python : localhost:8001 -> backend:8000
WSO2       : localhost:8291 -> wso2:8290
```

Dans Docker, les services utilisent les ports internes et le nom `db`.
Le port PostgreSQL `5434` est uniquement le port exposé sur Windows.

Depuis la racine du projet :

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Vérifier ensuite les valeurs locales avant de démarrer les services. Les
valeurs indispensables sont :

```text
POSTGRES_DB=products_db
POSTGRES_USER=products_user
POSTGRES_PASSWORD=<mot-de-passe-local>
POSTGRES_HOST_PORT=5434
BACKEND_HOST_PORT=8001
WSO2_HTTP_HOST_PORT=8291
DB_HOST=db
DB_PORT=5432
WSO2_DB_HOST=db
WSO2_DB_PORT=5432
```

`DB_*` est utilisé par Python et `WSO2_DB_*` par WSO2. Dans Docker, leurs
valeurs d'hôte doivent rester `db`, jamais `localhost`.

## Vérifier les conflits de ports

Avant le démarrage, vérifier si les ports hôtes sont libres :

```powershell
Get-NetTCPConnection -LocalPort 5434,8001,8291 -ErrorAction SilentlyContinue
```

Si un port est occupé, modifier uniquement le port hôte correspondant dans
`.env`, puis relancer Compose. Ne pas modifier `5432`, `8000` ou `8290` dans
les connexions internes des conteneurs.
