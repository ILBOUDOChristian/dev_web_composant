# 6. Vérification des services

Cette étape confirme que chaque composant répond avant les tests fonctionnels.

## Vérification de la configuration

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml config
```

Cette commande doit se terminer sans message d'erreur. Ne pas afficher le
contenu complet de `.env` dans un rapport, car il peut contenir un secret.

## Vérifications

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
curl.exe http://localhost:8001/health
curl.exe http://localhost:8001/api/v1/products
curl.exe -I http://localhost:3000
```

Tester le transfert WSO2 :

```powershell
curl.exe -X POST http://localhost:8291/products/transfer `
  -H "Content-Type: application/json" `
  -d '{"sku":"KB-001"}'
```

Tester un SKU absent doit retourner `404` :

```powershell
curl.exe -X POST http://localhost:8291/products/transfer `
  -H "Content-Type: application/json" `
  -d '{"sku":"UNKNOWN-999"}'
```

Consulter les logs :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs wso2
```

## Tableau de diagnostic rapide

| Symptôme | Vérification | Correction |
|---|---|---|
| `Bind ... port is already allocated` | `Get-NetTCPConnection -LocalPort 5434,8001,8291` | Modifier le port hôte concerné dans `.env`, puis recréer le service. |
| `service "db" is not running` | `docker compose ps db` | Démarrer `db` et lire `docker compose logs db`. |
| Backend `unhealthy` | `docker compose logs backend` | Vérifier `DB_*` et l'état `healthy` de PostgreSQL. |
| WSO2 ne démarre pas | `docker compose logs wso2` | Vérifier l'image, le pilote JDBC et `WSO2_DB_*`. |
| Transfert `404` | Rechercher le SKU dans `source.products` | Utiliser un SKU existant, par exemple `KB-001`. |
| API inaccessible | `docker compose ps` et test du port | Vérifier que le service est démarré et que le port hôte est libre. |
| Interface blanche | `docker compose logs frontend` et console du navigateur | Vérifier l'URL `8001`, le CORS et que le backend est `healthy`. |

Pour connaître le conteneur qui occupe un port Windows :

```powershell
$connection = Get-NetTCPConnection -LocalPort 5434 -ErrorAction SilentlyContinue
if ($connection) { Get-Process -Id $connection.OwningProcess }
```

Ne pas arrêter un processus sans avoir identifié qu'il appartient bien à un
autre projet.
