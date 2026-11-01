<#
.SYNOPSIS
  Cyber Law Awareness Portal — Staging Deployment Runner (PowerShell)
.DESCRIPTION
  Automates pre-flight validation, container/local builds, database seeding, and health checks.
#>

param(
  [string]$EnvFile = "server/.env.staging"
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  CYBER LAW AWARENESS PORTAL — STAGING DEPLOYMENT RUNNER (PWSH)" -ForegroundColor Cyan
Write-Host "================================================================="

if (-not (Test-Path $EnvFile)) {
  Write-Host "✖ Error: Environment file '$EnvFile' not found." -ForegroundColor Red
  Write-Host "  Copy server/.env.staging.example to $EnvFile and configure credentials."
  exit 1
}

Write-Host "`n[Step 1/5] Running Pre-Flight Environment Validation..." -ForegroundColor Yellow
node scripts/validate-staging-env.js $EnvFile

Write-Host "`n[Step 2/5] Building & Packaging Application Assets..." -ForegroundColor Yellow
$hasDocker = (Get-Command docker -ErrorAction SilentlyContinue) -and (Get-Command "docker-compose" -ErrorAction SilentlyContinue)

if ($hasDocker) {
  Write-Host "  * Docker Compose detected. Building staging containers..." -ForegroundColor Green
  docker compose -f docker-compose.staging.yml build --no-cache
  docker compose -f docker-compose.staging.yml up -d
} else {
  Write-Host "  * Docker not found. Performing local production asset compilation..." -ForegroundColor DarkYellow
  npm --prefix client run build
}

Write-Host "`n[Step 3/5] Verifying Service Health & Readiness Probe..." -ForegroundColor Yellow
$healthUrl = "http://localhost:5000/api/health"
$maxAttempts = 12
$attempt = 1
$healthy = $false

while ($attempt -le $maxAttempts) {
  try {
    $res = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 4
    if ($res.status -eq "healthy" -and $res.database -eq "connected") {
      $healthy = $true
      break
    }
  } catch {
    Write-Host "  Waiting for backend health probe ($attempt/$maxAttempts)..."
    Start-Sleep -Seconds 3
    $attempt++
  }
}

if ($healthy) {
  Write-Host "✔ Health probe responded 200 OK (database connected)." -ForegroundColor Green
} else {
  Write-Host "⚠ Note: Backend server not currently listening on port 5000 (manual startup required if running natively)." -ForegroundColor DarkYellow
}

Write-Host "`n[Step 4/5] Executing Non-Destructive Database Seeding..." -ForegroundColor Yellow
node server/config/seed.js

Write-Host "`n[Step 5/5] Running Post-Deployment Smoke Check..." -ForegroundColor Yellow
node --test server/tests/stagingProductionSmoke.test.js

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "✔ STAGING DEPLOYMENT PREPARATION COMPLETED" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan

