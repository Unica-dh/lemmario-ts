#!/bin/bash

# Script per eseguire l'importazione completa dei dati
# Include: reset database, seed livelli, importazione completa

set -e  # Exit on error

echo ""
echo "========================================================"
echo "  LEMMARIO - IMPORTAZIONE COMPLETA DATI LEGACY"
echo "========================================================"
echo ""
echo "⚠️  ATTENZIONE: Questo script eseguirà le seguenti azioni:"
echo ""
echo "  1. RESET DATABASE (elimina tutti i dati esistenti)"
echo "  2. Creazione Livelli di Razionalità (6 livelli)"
echo "  3. Importazione Fonti Bibliografiche (~83 fonti)"
echo "  4. Importazione Lemmi (~234 lemmi con definizioni e ricorrenze)"
echo ""
echo "Configurazione:"
echo "  - API URL: ${API_URL:-http://localhost:3000/api}"
echo "  - Lemmario ID: ${LEMMARIO_ID:-2}"
echo ""

# Chiedi conferma
read -p "Vuoi procedere? (sì/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Ss][Iì]$ ]]; then
    echo "❌ Operazione annullata."
    exit 0
fi

echo "✅ Confermato. Inizio importazione..."
echo ""

# Vai nella directory scripts
cd "$(dirname "$0")"

# Verifica che l'API sia raggiungibile
echo "🔍 Verifica connessione API..."
API_URL="${API_URL:-http://localhost:3000/api}"

if ! curl -s -f "${API_URL}/lemmari" > /dev/null 2>&1; then
    echo "❌ ERRORE: API non raggiungibile su ${API_URL}"
    echo "   Assicurati che il server Payload sia avviato:"
    echo "   docker compose up -d payload"
    exit 1
fi

echo "✅ API raggiungibile"
echo ""

# Step 1: Reset Database
echo "========================================================"
echo "STEP 1/4 - Reset Database"
echo "========================================================"
pnpm reset:db
echo ""

# Step 2: Seed Livelli
echo "========================================================"
echo "STEP 2/4 - Creazione Livelli di Razionalità"
echo "========================================================"
pnpm seed:livelli
echo ""

# Step 3: Import Fonti e Lemmi
echo "========================================================"
echo "STEP 3/4 - Importazione Fonti e Lemmi"
echo "========================================================"
pnpm migrate
echo ""

# Step 4: Report finale
echo "========================================================"
echo "STEP 4/4 - Verifica Finale"
echo "========================================================"
echo ""

# Verifica i dati importati
echo "📊 Statistiche Database:"
echo ""

FONTI_COUNT=$(curl -s "${API_URL}/fonti?limit=1" | jq -r '.totalDocs // 0')
LEMMI_COUNT=$(curl -s "${API_URL}/lemmi?limit=1" | jq -r '.totalDocs // 0')
DEFINIZIONI_COUNT=$(curl -s "${API_URL}/definizioni?limit=1" | jq -r '.totalDocs // 0')
RICORRENZE_COUNT=$(curl -s "${API_URL}/ricorrenze?limit=1" | jq -r '.totalDocs // 0')
LIVELLI_COUNT=$(curl -s "${API_URL}/livelli-razionalita?limit=1" | jq -r '.totalDocs // 0')
VARIANTI_COUNT=$(curl -s "${API_URL}/varianti-grafiche?limit=1" | jq -r '.totalDocs // 0')

echo "  ✓ Fonti:                    ${FONTI_COUNT}"
echo "  ✓ Lemmi:                    ${LEMMI_COUNT}"
echo "  ✓ Definizioni:              ${DEFINIZIONI_COUNT}"
echo "  ✓ Ricorrenze:               ${RICORRENZE_COUNT}"
echo "  ✓ Livelli Razionalità:      ${LIVELLI_COUNT}"
echo "  ✓ Varianti Grafiche:        ${VARIANTI_COUNT}"
echo ""

# Trova l'ultimo report generato
LATEST_REPORT=$(ls -t ../report_migration/migration_report_*.md 2>/dev/null | head -1)

if [ -n "$LATEST_REPORT" ]; then
    echo "📄 Report dettagliato salvato in:"
    echo "   ${LATEST_REPORT}"
    echo ""
fi

echo "========================================================"
echo "✅ IMPORTAZIONE COMPLETATA CON SUCCESSO!"
echo "========================================================"
echo ""
