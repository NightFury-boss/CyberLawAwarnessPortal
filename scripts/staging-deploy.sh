#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Cyber Law Awareness Portal — Staging Deployment Script
# Automates pre-flight validation, container build, database seeding, and health checks
# ==============================================================================

echo "================================================================="
echo "  CYBER LAW AWARENESS PORTAL — STAGING DEPLOYMENT RUNNER"
echo "================================================================="

ENV_FILE="${1:-server/.env.staging}"

if [ ! -f "$ENV_FILE" ]; then
  echo "✖ Error: Environment configuration file '$ENV_FILE' not found."
  echo "  Please copy server/.env.staging.example to $ENV_FILE and configure credentials."
  exit 1
fi

echo "[Step 1/5] Running Pre-Flight Environment Validation..."
node scripts/validate-staging-env.js "$ENV_FILE"

echo ""
echo "[Step 2/5] Building & Packaging Application Containers..."
if command -v docker &> /dev/null && command -v docker compose &> /dev/null; then
  echo "  * Docker Compose detected. Building staging images..."
  docker compose -f docker-compose.staging.yml build --no-cache
  echo "  * Starting staging services..."
  docker compose -f docker-compose.staging.yml up -d
else
  echo "  * Docker not detected. Falling back to native process manager workflow..."
  echo "  * Building client bundle with Vite..."
  npm --prefix client run build
  echo "  * Native staging processes can be supervised using PM2 or systemd."
fi

echo ""
echo "[Step 3/5] Verifying Service Health & Readiness Probe..."
MAX_ATTEMPTS=12
ATTEMPT=1
HEALTH_URL="http://localhost:5000/api/health"

# If docker is running frontend on port 80, health can also be probed through Nginx
if command -v curl &> /dev/null; then
  until curl -s -f "$HEALTH_URL" | grep -q '"status":"healthy"' || [ $ATTEMPT -gt $MAX_ATTEMPTS ]; do
    echo "  Waiting for backend health probe... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    sleep 3
    ATTEMPT=$((ATTEMPT + 1))
  done
fi

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
  echo "✖ Health check failed after $MAX_ATTEMPTS attempts."
  echo "  Check container logs with: docker compose -f docker-compose.staging.yml logs backend"
  exit 1
fi
echo "✔ Health probe returned 200 OK (database connected, service healthy)."

echo ""
echo "[Step 4/5] Executing Non-Destructive Database Seeding..."
# Runs idempotent seeder (will not wipe existing student accounts or sessions)
node server/config/seed.js

echo ""
echo "[Step 5/5] Running Post-Deployment Smoke Check..."
node --test server/tests/stagingProductionSmoke.test.js

echo ""
echo "================================================================="
echo "✔ STAGING DEPLOYMENT SUCCEEDED"
echo "  Frontend URL: http://localhost:80 (or configured staging domain)"
echo "  Backend API:  http://localhost:5000/api"
echo "  Health Probe: http://localhost:5000/api/health"
echo "================================================================="

