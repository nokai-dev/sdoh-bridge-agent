#!/bin/bash
# SDOH Bridge Agent — Start Script
# Usage: ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "SDOH Bridge Agent — Starting..."
echo "=========================================="

# Kill existing processes
for port in 3000 3001 3002 3003 3004; do
  fuser -k $port/tcp 2>/dev/null || true
done
pkill -f cloudflared 2>/dev/null || true
sleep 2

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Generate Synthea data if not present
if [ ! -d "synthea/patients" ]; then
  echo "Generating Synthea test patients..."
  npm run synthea
fi

echo ""
echo "Step 1: Starting Reverse Proxy on port 3000..."
nohup npx tsx reverse-proxy.ts > /tmp/proxy.log 2>&1 &
sleep 3

echo "Step 2: Starting SDOH Bridge Agents..."
PORT=3001 nohup npx tsx sdoh_bridge_agent/server.ts > /tmp/sdoh-agent.log 2>&1 &
PORT=3002 nohup npx tsx resource_agent/server.ts > /tmp/resource-agent.log 2>&1 &
PORT=3003 nohup npx tsx referral_agent/server.ts > /tmp/referral-agent.log 2>&1 &
PORT=3004 nohup npx tsx outreach_agent/server.ts > /tmp/outreach-agent.log 2>&1 &
sleep 5

echo "Step 3: Starting Cloudflare Tunnel..."
nohup bash -c 'npx cloudflared tunnel --url http://localhost:3000' > /tmp/cloudflared.log 2>&1 &
sleep 12

# Get Cloudflare URL
CF_URL=$(grep -o 'https://[^ ]*trycloudflare.com' /tmp/cloudflared.log | head -1)

echo ""
echo "=========================================="
echo "✅ All services started!"
echo "=========================================="
echo ""
echo "LOCAL ENDPOINTS:"
echo "  Proxy:       http://localhost:3000"
echo "  SDOH Agent:  http://localhost:3001"
echo "  Resource:    http://localhost:3002"
echo "  Referral:    http://localhost:3003"
echo "  Outreach:    http://localhost:3004"
echo ""
echo "CLOUDFLARE TUNNEL:"
echo "  $CF_URL"
echo ""
echo "Prompt Opinion Registration URLs:"
echo "  SDOH Bridge:  ${CF_URL}/sdoh_bridge/"
echo "  Resource:     ${CF_URL}/resource/"
echo "  Referral:     ${CF_URL}/referral/"
echo "  Outreach:     ${CF_URL}/outreach/"
echo ""
echo "Demo Presentation:"
echo "  file://${SCRIPT_DIR}/demo-video.html"
echo ""
echo "Log files:"
ls -la /tmp/*agent*.log /tmp/proxy.log /tmp/cloudflared.log 2>/dev/null
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep running
wait
