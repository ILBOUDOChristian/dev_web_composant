# Guide de démarrage chronologique

Ce document explique comment comprendre et démarrer le projet dans le bon
ordre. Le [README principal](../README.md) reste le point d'entrée général ;
ce guide détaille le rôle des fichiers et le chemin d'exécution complet.

## Vue d'ensemble

```text
1. Configuration
2. Initialisation PostgreSQL
3. Démarrage de l'API Python
4. Démarrage de WSO2
5. Assemblage Docker Compose
6. Vérification des services
7. Tests Insomnia
```

Le projet suit une séparation claire entre :

- la configuration ;
- la base de données ;
- l'API CRUD ;
- le flux d'intégration WSO2 ;
- l'orchestration Docker ;
- les tests.

## Étape 0 — Se placer dans le projet

Ouvrir PowerShell et se placer dans le dossier racine :

```powershell
cd C:\Users\hp\Desktop\DEV_COMPOSANT\api-rest-produits-groupe-7-si
```

Tous les chemins et toutes les commandes de ce guide partent de ce dossier.

## Étape 1 — Préparer la configuration

### Fichiers essentiels

| Fichier | Fonction |
|---|---|
| `.env` | Valeurs locales réellement utilisées par Docker Compose. Ce fichier peut contenir des secrets et reste local. |
| `.env.example` | Modèle partageable des variables attendues, sans secret réel. |
| `.gitignore` | Empêche notamment l'ajout de `.env`, des environnements virtuels et des artefacts de build. |

Copier le modèle si `.env` n'existe pas :

```powershell
Copy-Item .env.example .env
```

Vérifier ensuite les valeurs locales, notamment :

```text
POSTGRES_HOST_PORT=5434
BACKEND_HOST_PORT=8001
WSO2_HTTP_HOST_PORT=8291
```

### Comprendre les ports

Le port situé à gauche est celui de Windows. Le port situé à droite est celui
du conteneur :

```text
localhost:5434 -> db:5432
localhost:8001 -> backend:8000
localhost:8291 -> wso2:8290
```

Les conteneurs communiquent entre eux avec les noms Docker et les ports
internes. Par exemple, le backend utilise `db:5432`, et non `localhost:5434`.

## Étape 2 — Initialiser PostgreSQL

### Fichiers essentiels

| Fichier | Fonction |
|---|---|
| `docker-compose.yml` | Déclare le service PostgreSQL, son volume, son healthcheck et son port exposé. |
| `sql/schema.sql` | Crée les schémas `source` et `cible`, les tables `products`, les clés, les contraintes et les colonnes temporelles. |
| `sql/seed.sql` | Insère les trois produits de démonstration dans `source.products`. |

Démarrer uniquement PostgreSQL :

```powershell
docker compose up -d db
```

Vérifier son état :

```powershell
docker compose ps db
```

Le résultat attendu est `healthy`.

Vérifier les données et les deux tables :

```powershell
docker compose exec -T db psql -U products_user -d products_db -c "\dt source.*"
docker compose exec -T db psql -U products_user -d products_db -c "\dt cible.*"
docker compose exec -T db psql -U products_user -d products_db -c "SELECT sku, name, price, stock FROM source.products;"
```

### Fonctionnement des deux schémas

- `source.products` est la source de données du flux WSO2.
- `cible.products` reçoit les produits transférés et sert de table métier à
  l'API Python.
- Les contraintes `price >= 0`, `stock >= 0` et `sku UNIQUE` protègent les
  données.

## Étape 3 — Comprendre et démarrer l'API Python

### Fichiers essentiels

| Fichier | Fonction |
|---|---|
| `backend/Dockerfile` | Construit l'image Python et lance Uvicorn sur le port interne `8000`. |
| `backend/requirements.txt` | Déclare FastAPI, Pydantic, psycopg, Uvicorn et les outils de test. |
| `backend/app/main.py` | Déclare l'application FastAPI, le healthcheck et les routes HTTP. |
| `backend/app/schemas.py` | Définit les modèles d'entrée et de sortie des produits. |
| `backend/app/repository.py` | Ouvre la connexion PostgreSQL et exécute les requêtes paramétrées sur `cible.products`. |
| `backend/app/services.py` | Porte la logique métier entre les routes et le repository. |
| `backend/tests/test_api.py` | Vérifie le comportement de l'API avec les tests unitaires. |

Pour démarrer le backend avec Docker, l'assemblage complet de l'étape 5 est
recommandé. Le healthcheck direct est :

```powershell
curl.exe http://localhost:8001/health
```

Réponse attendue :

```json
{"status":"ok"}
```

Le chemin de données est :

```text
Requête HTTP
  -> backend/app/main.py
  -> backend/app/services.py
  -> backend/app/repository.py
  -> cible.products
```

## Étape 4 — Comprendre et construire WSO2

### Fichiers essentiels

| Fichier | Fonction |
|---|---|
| `wso2/pom.xml` | Décrit le build Maven MI 4.6.0, le pilote PostgreSQL, le CAR et l'image Docker. |
| `wso2/deployment/deployment.toml` | Configure la datasource `PRODUCTS_DB` et les paramètres PostgreSQL injectés au runtime. |
| `wso2/deployment/docker/Dockerfile` | Construit l'image WSO2 et installe le CAR ainsi que le pilote JDBC. |
| `wso2/src/main/wso2mi/artifacts/apis/ProductTransferAPI.xml` | Définit le flux `DBLookup -> transformation -> DBReport`. |

La configuration runtime de WSO2 utilisée par le conteneur provient de
`wso2/deployment/deployment.toml`. Le fichier `wso2/src/main/wso2mi/conf/deployment.toml`
est laissé vide : il n'est pas lu lors de la construction de l'image.

Le flux WSO2 traite un SKU à la fois :

1. réception de `POST /products/transfer` ;
2. recherche du SKU dans `source.products` avec `DBLookup` ;
3. normalisation de `name` avec `normalize-space` ;
4. insertion ou mise à jour dans `cible.products` avec `DBReport` ;
5. réponse XML `transferred` ou `not_found`.

Reconstruire l'artefact depuis le dossier WSO2 :

```powershell
cd wso2
mvn validate
mvn package
cd ..
```

Le pilote PostgreSQL `postgresql-42.7.4.jar` est nécessaire pour que WSO2
puisse accéder à la base.

## Étape 5 — Démarrer l'assemblage complet

### Fichier essentiel

| Fichier | Fonction |
|---|---|
| `docker-compose.dev.yml` | Ajoute le backend Python et WSO2 au service PostgreSQL défini dans le Compose principal. |

Depuis la racine du projet, copier `.env.example` vers `.env`, vérifier la
configuration, puis lancer directement Docker Compose. La commande construit
les images du backend, du frontend et de WSO2, puis démarre les services :

```powershell
Copy-Item .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Cette commande :

1. démarre PostgreSQL ;
2. attend que le healthcheck PostgreSQL soit valide ;
3. démarre le backend ;
4. attend les conditions de dépendance déclarées ;
5. démarre WSO2.

Vérifier l'état :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

État attendu :

| Service | Résultat |
|---|---|
| `db` | `healthy` |
| `backend` | `healthy` |
| `wso2` | démarré |

## Étape 6 — Vérifier chaque partie dans l'ordre

### 6.1 Vérifier PostgreSQL

```powershell
docker compose exec -T db psql -U products_user -d products_db -c "SELECT 'source' AS schema_name, count(*) FROM source.products UNION ALL SELECT 'cible', count(*) FROM cible.products;"
```

Après un transfert complet, les deux tables doivent contenir les produits
attendus.

### 6.2 Vérifier l'API Python

```powershell
curl.exe http://localhost:8001/health
curl.exe http://localhost:8001/api/v1/products
```

### 6.3 Vérifier WSO2

```powershell
curl.exe -X POST http://localhost:8291/products/transfer `
  -H "Content-Type: application/json" `
  -d '{"sku":"KB-001"}'
```

Le transfert de `KB-001` doit retourner une réponse XML avec
`status="transferred"`.

Tester un SKU absent :

```powershell
curl.exe -X POST http://localhost:8291/products/transfer `
  -H "Content-Type: application/json" `
  -d '{"sku":"UNKNOWN-999"}'
```

Le résultat attendu est `404` avec `status="not_found"`.

### 6.4 Vérifier les logs

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs wso2
```

Les logs ne doivent pas contenir d'erreur fonctionnelle liée à la datasource,
au pilote PostgreSQL ou au déploiement de l'API.

## Étape 7 — Exécuter les tests Insomnia

### Fichier essentiel

| Fichier | Fonction |
|---|---|
| `tests/insomnia/products.json` | Collection exportée contenant les requêtes de santé, CRUD Python et transfert WSO2. |

Importer le fichier dans Insomnia. Les variables prévues sont :

```text
python_base_url = http://localhost:8001
wso2_base_url   = http://localhost:8291
```

Ordre recommandé :

1. `Python - Health` ;
2. `Python - List products` ;
3. `Python - Create product` ;
4. remplacer `REPLACE_ID` par l'identifiant créé ;
5. `Python - Update product` ;
6. `Python - Delete product` ;
7. `WSO2 - Transfer product`.

Après les tests CRUD, supprimer les produits temporaires afin de conserver
une base propre.

## Étape 8 — Arrêter ou réinitialiser le projet

Arrêter les conteneurs sans supprimer le volume :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Arrêter et supprimer les données PostgreSQL :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

La commande `down -v` doit être utilisée uniquement lorsqu'une nouvelle
initialisation de `schema.sql` et `seed.sql` est souhaitée.

## Résumé du rôle de chaque dossier

| Dossier | Responsabilité |
|---|---|
| `backend/` | API REST CRUD et tests Python. |
| `sql/` | Structure et données initiales PostgreSQL. |
| `wso2/` | Intégration, datasource, API WSO2 et construction de l'image MI. |
| `tests/insomnia/` | Scénarios de test HTTP importables. |
| `docs/` | Documentation complémentaire du projet. |

Pour la présentation générale, les endpoints et les ports, consulter le
[README principal](../README.md).
