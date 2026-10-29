# 3. Démarrage de l'API Python

L'API FastAPI fournit le CRUD sur `cible.products`.

## Fichiers essentiels

- [main.py](../backend/app/main.py) : application FastAPI, healthcheck et routes.
- [schemas.py](../backend/app/schemas.py) : modèles de requêtes et réponses.
- [services.py](../backend/app/services.py) : logique métier.
- [repository.py](../backend/app/repository.py) : accès PostgreSQL paramétré.
- [Dockerfile](../backend/Dockerfile) : image et lancement Uvicorn.
- [requirements.txt](../backend/requirements.txt) : dépendances Python.

## Configuration du backend

En Docker, le backend reçoit automatiquement ces variables depuis `.env` :

```text
DB_HOST=db
DB_PORT=5432
DB_NAME=products_db
DB_USER=products_user
DB_PASSWORD=<même valeur que POSTGRES_PASSWORD>
```

Le backend écoute sur `0.0.0.0:8000` dans le conteneur et est accessible sur
`http://localhost:8001` depuis Windows.

## Démarrage avec Docker

PostgreSQL doit être démarré et sain avant le backend :

```powershell
docker compose up -d db
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps backend
```

## Démarrage local sans Docker

Cette méthode nécessite PostgreSQL accessible sur `localhost:5434`. Depuis
`backend` :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "5434"
$env:DB_NAME = "products_db"
$env:DB_USER = "products_user"
$env:DB_PASSWORD = "<mot-de-passe-local>"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Dans ce cas l'URL devient `http://localhost:8000`. Ne pas utiliser cette
configuration locale en même temps que le port `8000` déjà occupé par un autre
processus.

## Vérification

Avec le backend démarré :

```powershell
curl.exe http://localhost:8001/health
curl.exe http://localhost:8001/api/v1/products
```

Le healthcheck doit retourner :

```json
{"status":"ok"}
```

Les routes CRUD sont documentées dans le [README principal](../README.md).

## Tests unitaires

Depuis le dossier `backend` :

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

## Dépannage Python

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=100 backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())"
```

- `Connection refused` vers PostgreSQL : vérifier que `db` est `healthy` et
  que `DB_HOST=db`, `DB_PORT=5432` dans le conteneur.
- `422` : vérifier les champs `sku`, `name`, `price` et `stock`.
- `409` : le SKU existe déjà dans `cible.products`.
- `8001` occupé : changer `BACKEND_HOST_PORT` dans `.env`, puis recréer le
  service.
