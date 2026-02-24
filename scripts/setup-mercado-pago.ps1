# Setup Mercado Pago: tabela payments, deploy das Edge Functions e secrets.
# Requisitos:
#   1) npx supabase login   (uma vez)
#   2) .env com MERCADO_PAGO_ACCESS_TOKEN preenchido (Access Token de teste em Suas integrações > Credenciais de teste)

$ErrorActionPreference = "Stop"
$ProjectRef = "bzicdqrbqykypzesxayw"
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$Root\.env")) {
    Write-Error ".env nao encontrado em $Root. Crie e adicione MERCADO_PAGO_ACCESS_TOKEN (e opcional MERCADO_PAGO_WEBHOOK_SECRET)."
}

Write-Host "0/4 Verificando login Supabase..." -ForegroundColor Cyan
Push-Location $Root
$loginOk = $false
try { npx supabase functions list --project-ref $ProjectRef 2>&1 | Out-Null; if ($LASTEXITCODE -eq 0) { $loginOk = $true } } catch {}
if (-not $loginOk) {
    Pop-Location
    Write-Host "Execute primeiro: npx supabase login" -ForegroundColor Red
    throw "Supabase: access token nao fornecido. Rode 'npx supabase login' e execute este script de novo."
}
Pop-Location

# Carregar .env (linhas KEY=VALUE, sem aspas)
$envVars = @{}
Get-Content "$Root\.env" -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

$accessToken = $envVars["MERCADO_PAGO_ACCESS_TOKEN"]
if (-not $accessToken) {
    Write-Error "MERCADO_PAGO_ACCESS_TOKEN nao definido no .env. Adicione o Access Token de teste do Mercado Pago (Suas integracoes > Credenciais de teste)."
}

Write-Host "1/4 Aplicando migracao (tabela payments)..." -ForegroundColor Cyan
Push-Location $Root
try {
    npx supabase db push 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "AVISO: db push falhou (rode 'npx supabase link --project-ref bzicdqrbqykypzesxayw' uma vez com a senha do DB)." -ForegroundColor Yellow
        Write-Host "Ou execute o SQL em supabase/migrations/20250224000000_create_payments_table.sql no Dashboard > SQL Editor." -ForegroundColor Yellow
    }
} finally { Pop-Location }

Write-Host "2/4 Deploy mercado-pago-create-preference..." -ForegroundColor Cyan
Push-Location $Root
try {
    npx supabase functions deploy mercado-pago-create-preference --project-ref $ProjectRef 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Deploy create-preference falhou" }
} finally { Pop-Location }

Write-Host "3/4 Deploy mercado-pago-webhook..." -ForegroundColor Cyan
Push-Location $Root
try {
    npx supabase functions deploy mercado-pago-webhook --project-ref $ProjectRef --no-verify-jwt 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Deploy webhook falhou" }
} finally { Pop-Location }

Write-Host "4/4 Definindo secrets no Supabase..." -ForegroundColor Cyan
Push-Location $Root
try {
    npx supabase secrets set MERCADO_PAGO_ACCESS_TOKEN="$accessToken" --project-ref $ProjectRef
    if ($LASTEXITCODE -ne 0) { throw "Secrets set MERCADO_PAGO_ACCESS_TOKEN falhou" }
    $webhookSecret = $envVars["MERCADO_PAGO_WEBHOOK_SECRET"]
    if ($webhookSecret) {
        npx supabase secrets set MERCADO_PAGO_WEBHOOK_SECRET="$webhookSecret" --project-ref $ProjectRef
        if ($LASTEXITCODE -ne 0) { Write-Host "AVISO: MERCADO_PAGO_WEBHOOK_SECRET nao foi definido." -ForegroundColor Yellow }
    }
} finally { Pop-Location }

Write-Host "Concluido. Tabela payments, funcoes e secrets configurados." -ForegroundColor Green
