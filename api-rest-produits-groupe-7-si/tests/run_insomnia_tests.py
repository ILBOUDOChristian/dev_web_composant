import json
import urllib.request
import urllib.error
import urllib.parse
import os
import sys

def run_insomnia_collection():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    collection_file = os.path.join(script_dir, "insomnia", "products.json")

    if not os.path.exists(collection_file):
        print(f"Erreur : Impossible de trouver le fichier {collection_file}")
        return

    with open(collection_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    env = {}
    for res in data["resources"]:
        if res.get("_type") == "environment":
            env = res.get("data", {})
            break

    python_url = env.get("python_base_url", "http://localhost:8001")
    wso2_url = env.get("wso2_base_url", "http://localhost:8291")

    print("=" * 70)
    print(" EXÉCUTION AUTOMATISÉE DE LA COLLECTION INSOMNIA")
    print(f" Source : {collection_file}")
    print(f" Cibles : Python={python_url} | WSO2={wso2_url}")
    print("=" * 70)

    created_id = None
    passed = 0
    total = 0

    requests = [r for r in data["resources"] if r.get("_type") == "request"]

    for req in requests:
        total += 1
        name = req.get("name")
        method = req.get("method")
        raw_url = req.get("url")

        url = raw_url.replace("{{ _.python_base_url }}", python_url).replace("{{ _.wso2_base_url }}", wso2_url)
        if "REPLACE_ID" in url:
            url = url.replace("REPLACE_ID", str(created_id) if created_id else "999")

        body_raw = req.get("body", {}).get("text")
        data_bytes = body_raw.encode("utf-8") if body_raw else None

        print(f"\n[{total}/{len(requests)}] {method} {name}")
        print(f"      URL: {url}")

        req_obj = urllib.request.Request(url, data=data_bytes, method=method)
        req_obj.add_header("Accept", "application/json")
        if data_bytes:
            req_obj.add_header("Content-Type", "application/json")

        status_code = None
        response_body = ""

        try:
            with urllib.request.urlopen(req_obj, timeout=5) as response:
                status_code = response.getcode()
                response_body = response.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            status_code = e.code
            try:
                response_body = e.read().decode("utf-8")
            except Exception:
                pass
        except urllib.error.URLError as e:
            print(f"      Résultat    : [ERREUR DE CONNEXION] {e.reason}")
            continue
        except Exception as e:
            print(f"      Résultat    : [ERREUR] {e}")
            continue

        print(f"      Statut reçu : {status_code}")

        if method == "POST" and "Create" in name and status_code in (200, 201):
            try:
                resp_json = json.loads(response_body)
                created_id = resp_json.get("id")
                print(f"      -> Produit créé avec succès, ID: {created_id}")
            except Exception:
                pass

        is_ok = False
        if "404" in name:
            is_ok = (status_code == 404)
        elif method == "DELETE":
            is_ok = (status_code in (200, 204))
        elif method == "POST" and "Create" in name:
            is_ok = (status_code == 201)
        else:
            is_ok = (status_code == 200)

        if is_ok:
            print("      Résultat    : [SUCCÈS / CONFORME]")
            passed += 1
        else:
            print("      Résultat    : [ATTENTION - Statut attendu différent]")

    print("\n" + "=" * 70)
    print(f" BILAN : {passed}/{total} requêtes de la collection Insomnia exécutées avec succès.")
    print("=" * 70)

if __name__ == "__main__":
    run_insomnia_collection()
