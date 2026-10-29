# 5. Assemblage Docker Compose

Cette étape réunit PostgreSQL, l'API Python et WSO2 dans le même réseau Docker.

## Fichiers essentiels

- [docker-compose.yml](../docker-compose.yml) : service PostgreSQL.
- [docker-compose.dev.yml](../docker-compose.dev.yml) : services `backend` et
  `wso2`, dépendances et ports.
- [.env](../.env) : variables locales non versionnées.

## Démarrage complet

> **Prérequis — répertoire de travail** : toutes les commandes `docker compose`
> doivent être exécutées **depuis la racine du projet**, pas depuis le dossier
> parent. Si Docker signale `open docker-compose.yml: The system cannot find the
> file specified`, c'est que le répertoire courant est incorrect.
>
> ```powershell
> # Se placer dans le bon dossier avant tout
> cd api-rest-produits-groupe-7-si
> ```

**Premier démarrage :** copier `.env.example` vers `.env`, vérifier les
variables locales (en particulier `WSO2_KEYSTORE_PASSWORD`), puis lancer
Docker Compose depuis la racine du projet :

```powershell
Copy-Item .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Cette commande lance directement Compose avec `--build`, qui construit les images
du backend, du frontend et de WSO2. La construction WSO2 utilise un conteneur
Maven, donc Java et Maven ne doivent pas être installés sur la machine hôte.
Docker Compose v2 et un accès réseau à Docker Hub et Maven Central sont
nécessaires.

Sous Linux, l'utilisateur doit avoir accès au daemon Docker. En cas de
permission refusée sur `/var/run/docker.sock`, corriger les droits d'accès
Docker avant le lancement.

Tous les services (`db`, `backend`, `wso2`, `frontend`) ont `attach: false`
dans les fichiers Compose — ils démarrent silencieusement. Seul le service
éphémère `urls` est attaché : il affiche les accès puis se termine.
Docker Compose rend alors la main **sans arrêter les services en cours**.

Sortie attendue en fin de démarrage :

```text
urls-1  |   db           -> localhost:5434  (PostgreSQL)
urls-1  |   db UI        -> http://localhost:5050  (pgAdmin)
urls-1  |   backend      -> http://localhost:8001/health
urls-1  |   api produit  -> http://localhost:3001
```

> Les ports affichés sont ceux de votre `.env`.

Vérifier l'assemblage :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

État attendu :

| Conteneur   | Statut attendu | URL d'accès depuis l'hôte                          |
|-------------|----------------|-----------------------------------------------------|
| `pgadmin`   | `running`      | `http://localhost:5050` (PostgreSQL UI — pgAdmin)   |
| `backend`   | `healthy`      | `http://localhost:8001/health`                      |
| `frontend`  | `running`      | `http://localhost:3001`                             |

> Les ports `5434`, `8001`, `8291` et `3001` correspondent aux valeurs
> `POSTGRES_HOST_PORT`, `BACKEND_HOST_PORT`, `WSO2_HTTP_HOST_PORT` et
> `FRONTEND_HOST_PORT` de votre fichier `.env`. Si vous les modifiez,
> adaptez les URLs ci-dessus en conséquence.

## Démarrer les services séparément

```powershell
# Base uniquement
docker compose up -d db

# Base puis backend
docker compose up -d db
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d backend

# Base puis WSO2
docker compose up -d db
# Construire d'abord l'image locale WSO2 (voir docs/04-wso2.md), puis :
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d wso2
```

Pour voir le démarrage en direct (logs temps réel), enlever `-d` :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

## Arrêt et reconstruction

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml stop
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

`down` conserve le volume PostgreSQL ; `down -v` le supprime.

## Dépannage Compose

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml config
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=100
```

`config` permet de détecter une variable `.env` absente ou une erreur YAML.
Si un service ne démarre pas, lire d'abord ses logs et vérifier l'état de
`db` avant de reconstruire les images.
