#!/bin/bash
# Script per aggiungere label 'vpn' al runner self-hosted
# Esegui questo script sul server VPN (dhruby@90.147.144.147)

set -e

echo "🔧 Fix Runner Labels - Aggiunta label 'vpn'"
echo "============================================="

cd /home/dhruby/actions-runner

# Stop runner service
echo "⏹️  Stopping runner service..."
sudo systemctl --user stop actions.runner.*.service || true

# Remove runner
echo "🗑️  Removing current runner configuration..."
./config.sh remove --token "${RUNNER_TOKEN}"

echo ""
echo "✅ Runner rimosso con successo!"
echo ""
echo "📋 Prossimi step MANUALI:"
echo "1. Vai su GitHub Settings > Actions > Runners > New self-hosted runner"
echo "2. Copia il token di registrazione"
echo "3. Esegui sul server:"
echo ""
echo "   cd /home/dhruby/actions-runner"
echo "   ./config.sh --url https://github.com/Unica-dh/lemmario-ts --token <TOKEN>"
echo ""
echo "   Durante la configurazione:"
echo "   - Runner name: lemmario-vpn-runner"
echo "   - Additional labels: vpn    <-- IMPORTANTE!"
echo ""
echo "4. Reinstalla il servizio:"
echo "   sudo ./svc.sh install"
echo "   sudo ./svc.sh start"
echo ""
