# Deploy Backend Aquimaq — executar após: npx supabase login
# Uso: .\scripts\supabase-deploy.ps1

$ErrorActionPreference = "Stop"
$ProjectRef = "bzicdqrbqykypzesxayw"

Write-Host "Ligar ao projeto Supabase ($ProjectRef)..." -ForegroundColor Cyan
npx supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha no link. Executa: npx supabase login" -ForegroundColor Red
    exit 1
}

Write-Host "Aplicar migrations..." -ForegroundColor Cyan
npx supabase db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "db push falhou. Verifica se o remoto está vazio ou usa Dashboard para aplicar migrations." -ForegroundColor Yellow
}

Write-Host "Seed (opcional)..." -ForegroundColor Cyan
npx supabase db seed 2>$null

Write-Host "Publicar Edge Functions..." -ForegroundColor Cyan
npx supabase functions deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Deploy de functions falhou." -ForegroundColor Yellow
}

Write-Host "Concluido. Configura os secrets no Dashboard (Edge Functions -> Secrets)." -ForegroundColor Green
