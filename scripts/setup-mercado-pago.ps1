# Setup Mercado Pago - Deploy das Edge Functions e secrets
# Pré-requisitos: npx supabase login; ficheiro .env na raiz com MERCADO_PAGO_ACCESS_TOKEN (e opcionalmente MERCADO_PAGO_WEBHOOK_SECRET)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root ".env"

if (-not (Test-Path $envPath)) {
    Write-Error "Ficheiro .env não encontrado em $root. Crie um .env com MERCADO_PAGO_ACCESS_TOKEN (e opcionalmente MERCADO_PAGO_WEBHOOK_SECRET)."
}

$content = Get-Content $envPath -Raw
if ($content -notmatch "MERCADO_PAGO_ACCESS_TOKEN\s*=") {
    Write-Error ".env deve conter MERCADO_PAGO_ACCESS_TOKEN=..."
}

$projectRef = ""
if ($content -match "VITE_SUPABASE_URL=https://([a-z0-9]+)\.supabase\.co") {
    $projectRef = $Matches[1]
}
if (-not $projectRef) {
    Write-Error "VITE_SUPABASE_URL no .env deve ser https://<PROJECT_REF>.supabase.co para usar deploy sem supabase link."
}

$projectArg = "--project-ref", $projectRef

Push-Location $root

try {
    Write-Host "Deploy da função checkout (com JWT)..."
    npx supabase functions deploy checkout @projectArg
    if ($LASTEXITCODE -ne 0) { throw "Deploy checkout falhou." }

    Write-Host "Deploy da função mercado-pago-webhook (sem JWT)..."
    npx supabase functions deploy mercado-pago-webhook --no-verify-jwt @projectArg
    if ($LASTEXITCODE -ne 0) { throw "Deploy mercado-pago-webhook falhou." }

    $tokenLine = Get-Content $envPath | Where-Object { $_ -match "^\s*MERCADO_PAGO_ACCESS_TOKEN\s*=" } | Select-Object -First 1
    $token = ($tokenLine -replace "^\s*MERCADO_PAGO_ACCESS_TOKEN\s*=\s*", "").Trim().Trim('"').Trim("'")
    if (-not $token) {
        Write-Error "MERCADO_PAGO_ACCESS_TOKEN está vazio no .env."
    }
    npx supabase secrets set "MERCADO_PAGO_ACCESS_TOKEN=$token" @projectArg
    if ($LASTEXITCODE -ne 0) { throw "supabase secrets set MERCADO_PAGO_ACCESS_TOKEN falhou." }

    $secretLine = Get-Content $envPath | Where-Object { $_ -match "^\s*MERCADO_PAGO_WEBHOOK_SECRET\s*=" } | Select-Object -First 1
    if ($secretLine) {
        $secret = ($secretLine -replace "^\s*MERCADO_PAGO_WEBHOOK_SECRET\s*=\s*", "").Trim().Trim('"').Trim("'")
        if ($secret) {
            npx supabase secrets set "MERCADO_PAGO_WEBHOOK_SECRET=$secret" @projectArg
            if ($LASTEXITCODE -ne 0) { Write-Warning "supabase secrets set MERCADO_PAGO_WEBHOOK_SECRET falhou." }
        }
    }

    Write-Host "Setup concluído. Funções checkout e mercado-pago-webhook em deploy; secrets configurados."
}
finally {
    Pop-Location
}
