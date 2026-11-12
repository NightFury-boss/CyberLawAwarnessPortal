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

USING_DOCKER=false
echo ""
echo "[Step 2/5] Building & Packaging Application Containers..."
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  USING_DOCKER=true
  echo "  * Docker Compose detected. Building staging images with --env-file $ENV_FILE..."
  docker compose --env-file "$ENV_FILE" -f docker-compose.staging.yml build --no-cache
  echo "  * Starting staging services..."
  docker compose --env-file "$ENV_FILE" -f docker-compose.staging.yml up -d
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
STAGING_BIND=$(grep -E '^STAGING_HOST_BIND=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"\r' || true)
STAGING_PORT_VAL=$(grep -E '^STAGING_PORT=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"\r' || true)
STAGING_BIND="${STAGING_BIND:-127.0.0.1}"
STAGING_PORT_VAL="${STAGING_PORT_VAL:-8080}"

if [ "$USING_DOCKER" = true ]; then
  HEALTH_URL="http://${STAGING_BIND}:${STAGING_PORT_VAL}/api/health"
else
  HEALTH_URL="http://127.0.0.1:5000/api/health"
fi

if ! command -v curl &> /dev/null; then
  echo "✖ curl is required for post-start health verification at $HEALTH_URL."
  exit 1
fi

HEALTH_OK=false
while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  if curl -fsS "$HEALTH_URL" | grep -q '"status":"healthy"'; then
    HEALTH_OK=true
    break
  fi
  echo "  Waiting for service health probe ($HEALTH_URL)... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 3
  ATTEMPT=$((ATTEMPT + 1))
done

if [ "$HEALTH_OK" != true ]; then
  echo "✖ Health check failed after $MAX_ATTEMPTS attempts at $HEALTH_URL."
  if [ "$USING_DOCKER" = true ]; then
    echo "  Check container logs with: docker compose --env-file $ENV_FILE -f docker-compose.staging.yml logs"
  fi
  exit 1
fi
echo "✔ Health probe returned 200 OK at $HEALTH_URL (database connected, service healthy)."

echo ""
echo "[Step 4/5] Executing Non-Destructive Database Seeding..."
if [ "$USING_DOCKER" = true ]; then
  docker compose --env-file "$ENV_FILE" -f docker-compose.staging.yml exec -T -e ASSERT_STAGING_DB=true backend node config/seed.js
else
  ASSERT_STAGING_DB=true node server/config/seed.js
fi

echo ""
echo "[Step 5/5] Running Post-Deployment Integration Smoke Check..."
node --test server/tests/stagingProductionSmoke.test.js

echo ""
echo "================================================================="
echo "✔ STAGING DEPLOYMENT SUCCEEDED"
echo "  Frontend/Proxy URL: http://${STAGING_BIND}:${STAGING_PORT_VAL}"
echo "  Health Probe:       ${HEALTH_URL}"
echo "================================================================="

