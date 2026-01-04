#!/usr/bin/env python3
"""
Script per spostare lemmi da un lemmario all'altro usando l'API REST
"""

import requests
import sys
import time

API_URL = "http://localhost:3000/api"
FROM_LEMMARIO = int(sys.argv[1]) if len(sys.argv) > 1 else 2
TO_LEMMARIO = int(sys.argv[2]) if len(sys.argv) > 2 else 3

# Login
print(f"🔐 Login come admin...")
login_response = requests.post(
    f"{API_URL}/utenti/login",
    json={"email": "admin@lemmario.dev", "password": "password"},
    timeout=10
)

if not login_response.ok:
    print(f"❌ Errore login: {login_response.status_code}")
    sys.exit(1)

token = login_response.json()["token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print(f"✅ Login completato")
print(f"🔄 Spostamento lemmi da lemmario {FROM_LEMMARIO} a {TO_LEMMARIO}")
print("")

# Ricerca lemmi in pagine
page = 1
total_moved = 0
batch_size = 50

while True:
    print(f"📄 Pagina {page}...")
    
    # Ricerca lemmi
    response = requests.get(
        f"{API_URL}/lemmi",
        params={
            "limit": batch_size,
            "page": page,
            "where[lemmario][equals]": FROM_LEMMARIO
        },
        headers=headers,
        timeout=10
    )
    
    if not response.ok:
        print(f"❌ Errore ricerca: {response.status_code}")
        break
    
    data = response.json()
    lemmi = data.get("docs", [])
    
    if not lemmi:
        print("✅ Nessun altro lemma trovato")
        break
    
    print(f"   Trovati {len(lemmi)} lemmi")
    
    # Sposta ogni lemma
    for lemma in lemmi:
        lemma_id = lemma["id"]
        
        update_response = requests.patch(
            f"{API_URL}/lemmi/{lemma_id}",
            json={"lemmario": TO_LEMMARIO},
            headers=headers,
            timeout=10
        )
        
        if update_response.ok:
            total_moved += 1
            print(f"\r   Spostati: {total_moved} lemmi", end="", flush=True)
        else:
            print(f"\n   ❌ Errore spostamento lemma {lemma_id}: {update_response.status_code}")
    
    print("")
    
    # Verifica se c'è una pagina successiva
    if not data.get("hasNextPage", False):
        break
    
    page += 1
    time.sleep(0.5)  # Evita di sovraccaricare il server

print("")
print(f"✅ Spostamento completato: {total_moved} lemmi")

# Verifica risultato
print("")
print("📊 Verifica finale:")

result2 = requests.get(
    f"{API_URL}/lemmi",
    params={"limit": 1, "where[lemmario][equals]": FROM_LEMMARIO},
    headers=headers,
    timeout=10
).json()

result3 = requests.get(
    f"{API_URL}/lemmi",
    params={"limit": 1, "where[lemmario][equals]": TO_LEMMARIO},
    headers=headers,
    timeout=10
).json()

print(f"  Lemmi in lemmario {FROM_LEMMARIO}: {result2['totalDocs']}")
print(f"  Lemmi in lemmario {TO_LEMMARIO}: {result3['totalDocs']}")
