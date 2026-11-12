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
$usingDocker = $false
if (Get-Command docker -ErrorAction SilentlyContinue) {
  & docker compose version *> $null
  if ($LASTEXITCODE -eq 0) {
    $usingDocker = $true
  }
}

$envMap = @{}
foreach ($line in Get-Content $EnvFile) {
  $trimmed = $line.Trim()
  if (-not $trimmed -or $trimmed.StartsWith('#') -or -not $trimmed.Contains('=')) { continue }
  $parts = $trimmed.Split('=', 2)
  $envMap[$parts[0].Trim()] = $parts[1].Trim().Trim('"')
}
$stagingBind = if ($envMap['STAGING_HOST_BIND']) { $envMap['STAGING_HOST_BIND'] } else { '127.0.0.1' }
$stagingPort = if ($envMap['STAGING_PORT']) { $envMap['STAGING_PORT'] } else { '8080' }

if ($usingDocker) {
  Write-Host "  * Docker Compose detected. Building staging containers with --env-file $EnvFile..." -ForegroundColor Green
  docker compose --env-file $EnvFile -f docker-compose.staging.yml build --no-cache
  if ($LASTEXITCODE -ne 0) { throw "Docker Compose build failed." }
  docker compose --env-file $EnvFile -f docker-compose.staging.yml up -d
  if ($LASTEXITCODE -ne 0) { throw "Docker Compose up failed." }
} else {
  Write-Host "  * Docker Compose not found. Performing local production asset compilation..." -ForegroundColor DarkYellow
  npm --prefix client run build
  if ($LASTEXITCODE -ne 0) { throw "Client build failed." }
}

Write-Host "`n[Step 3/5] Verifying Service Health & Readiness Probe..." -ForegroundColor Yellow
$healthUrl = if ($usingDocker) { "http://${stagingBind}:${stagingPort}/api/health" } else { "http://127.0.0.1:5000/api/health" }
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
    Write-Host "  Health probe at $healthUrl returned degraded/unexpected state (attempt $attempt/$maxAttempts)..."
  } catch {
    Write-Host "  Waiting for health probe at $healthUrl ($attempt/$maxAttempts)..."
  }
  Start-Sleep -Seconds 3
  $attempt++
}

if ($healthy) {
  Write-Host "✔ Health probe responded 200 OK at $healthUrl (database connected)." -ForegroundColor Green
} else {
  Write-Host "✖ Health check failed after $maxAttempts attempts at $healthUrl." -ForegroundColor Red
  exit 1
}

Write-Host "`n[Step 4/5] Executing Non-Destructive Database Seeding..." -ForegroundColor Yellow
if ($usingDocker) {
  docker compose --env-file $EnvFile -f docker-compose.staging.yml exec -T -e ASSERT_STAGING_DB=true backend node config/seed.js
} else {
  $env:ASSERT_STAGING_DB = "true"
  node server/config/seed.js
}
if ($LASTEXITCODE -ne 0) { throw "Staging database seeding failed." }

Write-Host "`n[Step 5/5] Running Post-Deployment Integration Smoke Check..." -ForegroundColor Yellow
node --test server/tests/stagingProductionSmoke.test.js
if ($LASTEXITCODE -ne 0) { throw "Smoke test suite failed." }

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "✔ STAGING DEPLOYMENT SUCCEEDED ($healthUrl)" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan

