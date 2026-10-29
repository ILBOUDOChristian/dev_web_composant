# API REST de produits — Groupe 7 SI

Projet du thème 10 : une API REST de produits avec Python, PostgreSQL et
WSO2 Micro Integrator 4.6.0.

## Architecture

```text
Insomnia
   |
   v
WSO2 Micro Integrator 4.6.0
   |
   v
PostgreSQL
  source.products --transfert + normalisation du nom--> cible.products
                                                        ^
                                                        |
                                              API Python CRUD
```

La base PostgreSQL contient une seule base physique (`products_db`) et deux
schémas logiques :

- `source.products` : produits d'origine utilisés par le flux WSO2 ;
- `cible.products` : produits transférés et exposés par l'API Python.

## Prérequis

- Docker Desktop démarré ;
- Docker Compose v2 (`docker compose`) ;
- Insomnia, uniquement pour rejouer la collection de tests ;

## Configuration

Le fichier `.env` contient la configuration locale effective et ne doit pas
être versionné. Utiliser [.env.example](.env.example) comme modèle.

Les ports exposés sur la machine hôte sont :

| Service | Port hôte | Port interne | Description |
|---|---:|---:|---|
| Base de données (UI) | `5050` | `80` | pgAdmin (Navigateur) |
| API Python | `8001` | `8000` | Backend FastAPI |
| WSO2 MI | `8291` | `8290` | API d'intégration |
| Interface web | `3001` | `80` | Frontend Nginx |

Le port PostgreSQL UI est `5050` pour permettre une consultation directe dans
le navigateur via pgAdmin. L'accès brut à PostgreSQL se fait sur le port `5434`.
À l'intérieur du réseau Compose, les conteneurs se connectent toujours à
PostgreSQL avec `db:5432`.

## Démarrage de l'assemblage

Depuis la racine du projet, créer `.env` depuis `.env.example`, vérifier la
configuration, puis lancer directement Docker Compose. Cette commande construit
les images définies par les fichiers Docker Compose. Une connexion à Docker Hub
et Maven Central est nécessaire.

L'image WSO2 est également construite automatiquement par Docker Compose avec
un conteneur Maven. Java et Maven ne doivent donc pas être installés sur la
machine hôte.

```powershell
Copy-Item .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Sous Linux, l'utilisateur doit pouvoir accéder au daemon Docker. Si `docker
info` signale une permission refusée sur `docker.sock`, corrigez l'accès Docker
pour cet utilisateur avant de lancer Compose.

Vérifier l'état des services :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

Résultat attendu :

- `db` : `healthy` ;
- `backend` : `healthy` ;
- `wso2` : démarré.
- `frontend` : accessible sur `http://localhost:3001`.

Pour suivre toute la procédure dans l'ordre, avec le rôle détaillé de chaque
fichier essentiel, consulter le
[guide de démarrage chronologique](docs/DEMARRAGE-CHRONOLOGIQUE.md).

## Parcours de démarrage du projet

Le projet doit être parcouru dans cet ordre. Chaque étape possède une fiche
explicative qui présente sa fonction, ses fichiers essentiels et ses commandes.

1. [Configuration](docs/01-configuration.md)
2. [Initialisation PostgreSQL](docs/02-initialisation-postgresql.md)
3. [Démarrage de l'API Python](docs/03-api-python.md)
4. [Démarrage de WSO2](docs/04-wso2.md)
5. [Assemblage Docker Compose](docs/05-assemblage-docker-compose.md)
6. [Vérification des services](docs/06-verification-services.md)
7. [Tests Insomnia](docs/07-tests-insomnia.md)

La [documentation chronologique complète](docs/DEMARRAGE-CHRONOLOGIQUE.md)
regroupe également toutes les étapes dans un seul parcours.

En cas de problème, consulter le
[guide de dépannage](docs/08-depannage.md), qui regroupe les erreurs de ports,
de configuration, de dépendances, de connexion PostgreSQL, de backend et de
WSO2.

Arrêter les services :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Pour supprimer également les données PostgreSQL locales :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

Cette dernière commande réinitialise la base et les données créées dans le
volume Docker.

## API Python

L'API cible exclusivement `cible.products`.

### Vérification de santé

```http
GET http://localhost:8001/health
```

Réponse attendue :

```json
{"status":"ok"}
```

### Routes CRUD

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/v1/products` | Lister les produits |
| `GET` | `/api/v1/products/{id}` | Lire un produit |
| `POST` | `/api/v1/products` | Créer un produit |
| `PUT` | `/api/v1/products/{id}` | Modifier un produit |
| `DELETE` | `/api/v1/products/{id}` | Supprimer un produit |

Exemple de création :

```powershell
curl.exe -X POST http://localhost:8001/api/v1/products `
  -H "Content-Type: application/json" `
  -d '{"sku":"TEST-001","name":"Produit test","description":"Démonstration","price":"10.50","stock":4}'
```

Codes d'erreur principaux :

- `404` : produit inexistant ;
- `409` : SKU déjà utilisé ;
- `422` : corps de requête invalide.

### Documentation OpenAPI

FastAPI génère automatiquement le contrat OpenAPI de l'API Python :

| Ressource | URL directe | Via le reverse proxy |
|---|---|---|
| Contrat OpenAPI (JSON) | `http://localhost:8001/openapi.json` | `http://localhost:3001/api-backend/openapi.json` |
| Interface Swagger UI | `http://localhost:8001/docs` | `http://localhost:3001/api-backend/docs` |
| Interface ReDoc | `http://localhost:8001/redoc` | `http://localhost:3001/api-backend/redoc` |

Ce contrat décrit les opérations CRUD, les schémas `Product`, `ProductCreate`
et `ProductUpdate`, ainsi que les codes de réponse (`201`, `404`, `409`,
`422`). Il sert de livrable OpenAPI du projet et peut être importé dans
Insomnia ou Swagger Editor.

## Flux WSO2

L'API WSO2 est exposée par :

```http
POST http://localhost:8291/products/transfer
```

Corps de la requête :

```json
{
  "sku": "KB-001"
}
```

Le flux :

1. recherche le SKU dans `source.products` avec `DBLookup` ;
2. normalise le nom avec `normalize-space` ;
3. insère ou met à jour le produit dans `cible.products` avec `DBReport`.

Le transfert est idempotent grâce à `ON CONFLICT (sku)`.

Réponse de succès :

```xml
<transferResult status="transferred" sku="KB-001" name="Clavier USB"/>
```

Pour un SKU absent de `source.products`, la réponse est `404` :

```xml
<transferResult status="not_found" sku="UNKNOWN-999"/>
```

En cas d'erreur technique (base indisponible, erreur SQL), le `faultSequence`
renvoie `500` :

```xml
<transferResult status="error" message="..."/>
```

## Tests Insomnia

La collection est disponible dans
[tests/insomnia/products.json](tests/insomnia/products.json).

Elle contient les requêtes suivantes :

- health de l'API Python ;
- liste des produits ;
- création, modification et suppression d'un produit ;
- transfert d'un produit avec WSO2.

Après la requête de création, remplacer `REPLACE_ID` dans les requêtes
`PUT` et `DELETE` par l'identifiant retourné.

Les variables d'environnement Insomnia sont :

```text
python_base_url = http://localhost:8001
wso2_base_url   = http://localhost:8291
```

## Tests automatisés

Deux niveaux de tests sont fournis :

| Fichier | Portée | Prérequis |
|---|---|---|
| `backend/tests/test_api.py` | Tests unitaires de l'API (dépôt simulé) | Aucun |
| `backend/tests/test_e2e.py` | Test de bout en bout de la chaîne réelle | Pile démarrée |

Le test de bout en bout traverse toute la chaîne :

1. transfert par WSO2 d'un SKU présent dans `source.products` ;
2. contrôle du produit transféré dans `cible.products` via l'API Python ;
3. création, lecture, modification et suppression d'un produit par l'API ;
4. contrôle des cas d'erreur (`404` SKU absent de la source, `409` SKU déjà
   utilisé, `422` corps invalide).

Si le backend ou WSO2 n'est pas joignable, ces tests sont ignorés
automatiquement, ce qui laisse `pytest` vert sur un poste sans Docker.

```powershell
cd backend
python -m pytest -q
```

Résultat attendu avec la pile démarrée : `8 passed`.

## Présentation du projet

Le support de soutenance est disponible à la racine du dépôt :
[PRESENTATION_PROJET_DEV_COMPOSANT_2026_GROUPE7_SI.pptx](PRESENTATION_PROJET_DEV_COMPOSANT_2026_GROUPE7_SI.pptx).
Il couvre le contexte, l'architecture, le flux WSO2, l'API Python, la procédure
d'installation, les tests et le bilan.

## Vérifications réalisées

L'assemblage actuel a été validé avec :

- PostgreSQL `healthy` ;
- présence des schémas `source` et `cible` ;
- trois produits dans `source.products` ;
- trois produits transférés dans `cible.products` ;
- CRUD Python réel dans Compose ;
- transfert WSO2 réel ;
- cas WSO2 avec SKU inexistant (`404`) ;
- validation d'un corps Python invalide (`422`) ;
- validation JSON de la collection Insomnia ;
- absence d'erreurs fonctionnelles dans les logs WSO2 après les tests.

## Structure du projet

```text
.
├── backend/                  # API FastAPI et tests Python
├── frontend/                 # Interface web et reverse proxy Nginx
├── sql/                      # Schéma et données initiales PostgreSQL
├── docs/                     # Documentation du projet
├── tests/insomnia/           # Collection Insomnia exportée
├── wso2/
│   ├── deployment/           # Configuration MI et Dockerfile
│   └── src/                  # API et artefacts WSO2
├── docker-compose.yml        # Service PostgreSQL
├── docker-compose.dev.yml    # Backend Python et WSO2
├── .env.example              # Modèle de configuration
├── PRESENTATION_PROJET_DEV_COMPOSANT_2026_GROUPE7_SI.pptx  # Support de soutenance
└── README.md
```

## Reconstruction de l'artefact WSO2

L'image WSO2 n'est pas construite par Docker Compose : elle doit être générée
depuis le dossier `wso2`, avec le profil `docker`. Ce profil compile le CAR,
applique la configuration et construit l'image
`api-rest-produits-groupe-7-si-wso2:1.0.0` utilisée par Compose.

```powershell
cd wso2
$env:WSO2_KEYSTORE_PASSWORD = "<valeur de WSO2_KEYSTORE_PASSWORD de .env>"
.\mvnw.cmd clean package -Pdocker
```

Si Maven n'est pas installé, utiliser le wrapper fourni : `.\mvnw.cmd clean
package -Pdocker`.

Le pilote PostgreSQL est intégré à l'artefact et copié dans `MI_HOME/lib` lors
de la construction de l'image. Après reconstruction, recréer le conteneur :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --force-recreate wso2
```
