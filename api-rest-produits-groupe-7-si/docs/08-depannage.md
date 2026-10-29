# Dépannage du projet

Ce guide s'applique après avoir suivi les étapes du
[README principal](../README.md). Toujours commencer par observer l'état et
les logs avant de supprimer un conteneur ou un volume.

## 1. Vérifier l'état global

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
docker compose -f docker-compose.yml -f docker-compose.dev.yml config
```

Résultat attendu :

- `db` : `healthy` ;
- `backend` : `healthy` ;
- `wso2` : `Up` ;
- `frontend` : `Up`.

## 2. Lire les logs

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=200 db
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=200 backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=200 wso2
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=200 frontend
```

Pour suivre les logs en direct :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend
```

Arrêter le suivi avec `Ctrl+C`, sans arrêter le conteneur.

## 3. Port déjà utilisé

Erreur typique :

```text
Bind for 0.0.0.0:5434 failed: port is already allocated
```

Identifier le processus :

```powershell
Get-NetTCPConnection -LocalPort 5434,8001,8291 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,OwningProcess
```

Modifier le port hôte concerné dans `.env`. Par exemple, changer
`POSTGRES_HOST_PORT=5434` en `POSTGRES_HOST_PORT=5440`. Ne pas modifier
`DB_PORT=5432` ou `WSO2_DB_PORT=5432` lorsque les services utilisent Docker.

Recréer ensuite le service :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --force-recreate
```

## 4. PostgreSQL ne démarre pas

```powershell
docker compose ps db
docker compose logs --tail=200 db
docker compose exec -T db pg_isready -U products_user -d products_db
```

Causes courantes :

- variables `POSTGRES_*` incorrectes ;
- port hôte occupé ;
- conteneur d'un autre projet utilisant déjà le nom ou le port ;
- volume initialisé avec une ancienne configuration.

Réinitialiser uniquement si les données peuvent être perdues :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
```

## 5. Backend Python inaccessible

```powershell
curl.exe http://localhost:8001/health
docker compose logs --tail=200 backend
docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())"
```

Si le test interne réussit mais le test Windows échoue, le problème concerne
le mapping `BACKEND_HOST_PORT`. Si les deux échouent, vérifier PostgreSQL et
les variables `DB_*`.

## 6. Erreurs de requête API

- `404` : l'identifiant n'existe pas ;
- `409` : le SKU est déjà présent dans `cible.products` ;
- `422` : le JSON ou un type de champ est invalide ;
- `500` : consulter les logs backend et vérifier la connexion PostgreSQL.

## 7. WSO2 ne démarre pas ou ne transfère pas

```powershell
docker compose logs --tail=300 wso2
docker image inspect api-rest-produits-groupe-7-si-wso2:1.0.0
docker compose exec -T db psql -U products_user -d products_db -c "SELECT sku FROM source.products;"
```

Vérifier :

- l'image WSO2 existe ;
- `postgresql-42.7.4.jar` est présent dans `wso2/deployment/libs` ;
- les variables `WSO2_DB_*` utilisent `db:5432` ;
- le SKU demandé existe dans `source.products`.

Si l'image n'existe pas, reconstruire WSO2 avec Docker Compose depuis la
racine du projet :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml build wso2
```

La construction utilise Maven dans Docker et ne nécessite pas d'installation
Java sur la machine hôte.

Un transfert d'un SKU absent doit retourner `404` ; ce n'est pas une erreur
Docker.

## 8. Dépendances Python ou build échoué

Reconstruire uniquement le backend :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d backend
```

Tester les dépendances locales :

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest -q
cd ..
```

## 9. Collection Insomnia

Si une requête Insomnia échoue :

1. vérifier `python_base_url` et `wso2_base_url` ;
2. tester la même URL avec `curl.exe` ;
3. vérifier le header `Content-Type: application/json` ;
4. remplacer `REPLACE_ID` après la création d'un produit ;
5. lire les logs du service concerné.

La collection est dans
[tests/insomnia/products.json](../tests/insomnia/products.json).

## 10. Interface web

Ouvrir [http://localhost:3001](http://localhost:3001) après le démarrage
Compose. Nginx transmet les appels de l'interface vers `backend:8000` et
`wso2:8290` dans le réseau Docker ; le navigateur n'a donc pas besoin
d'appeler directement les ports `8001` et `8291`.

Si les produits ne s'affichent pas :

```powershell
curl.exe http://localhost:8001/health
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=100 frontend
```

Si l'interface affiche une erreur réseau, vérifier le reverse proxy et les
services internes :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=100 frontend
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

## 11. Nettoyage normal

Arrêter sans supprimer les données :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Réinitialiser les données et les scripts SQL :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

La seconde procédure détruit les données locales de PostgreSQL.
