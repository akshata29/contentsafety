# Capital Markets AI Safety Demo - Deployment Script
# Builds a single Docker image (frontend + backend) and deploys to Azure App Service.
# App Service Plan and ACR are assumed to already exist.

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,

    [Parameter(Mandatory=$true)]
    [string]$AcrName,

    [Parameter(Mandatory=$true)]
    [string]$AppServicePlanName,

    [Parameter(Mandatory=$true)]
    [string]$WebAppName,

    [Parameter(Mandatory=$false)]
    [string]$ImageName = "contentsafety-app",

    [Parameter(Mandatory=$false)]
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$FullImageName = "$AcrName.azurecr.io/$ImageName`:$ImageTag"
$AppUrl       = "https://$WebAppName.azurewebsites.net"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Capital Markets AI Safety - Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Resource Group : $ResourceGroup"
Write-Host "  ACR            : $AcrName"
Write-Host "  App Service    : $WebAppName"
Write-Host "  Image          : $FullImageName"
Write-Host ""

# ----------------------------------------------------------------
# 1. Verify Azure login
# ----------------------------------------------------------------
Write-Host "[1/7] Checking Azure login..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Not logged in - launching az login..." -ForegroundColor Red
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Host "  Logged in as : $($account.user.name)" -ForegroundColor Green
Write-Host "  Subscription : $($account.name)" -ForegroundColor Green
Write-Host ""

# ----------------------------------------------------------------
# 2. Log in to ACR and build + push image
# ----------------------------------------------------------------
Write-Host "[2/7] Logging into ACR..." -ForegroundColor Yellow
az acr login --name $AcrName
Write-Host ""

Write-Host "[3/7] Building Docker image (frontend + backend)..." -ForegroundColor Yellow
docker build -t "$ImageName`:$ImageTag" .
if ($LASTEXITCODE -ne 0) { Write-Host "Docker build failed" -ForegroundColor Red; exit 1 }

docker tag "$ImageName`:$ImageTag" $FullImageName
docker push $FullImageName
if ($LASTEXITCODE -ne 0) { Write-Host "Docker push failed" -ForegroundColor Red; exit 1 }
Write-Host "  Image pushed: $FullImageName" -ForegroundColor Green
Write-Host ""

# ----------------------------------------------------------------
# 3. Get ACR credentials for App Service pull
# ----------------------------------------------------------------
Write-Host "[4/7] Retrieving ACR credentials..." -ForegroundColor Yellow
az acr update --name $AcrName --admin-enabled true | Out-Null
$acrCreds   = az acr credential show --name $AcrName | ConvertFrom-Json
$acrServer  = "$AcrName.azurecr.io"
$acrUser    = $acrCreds.username
$acrPass    = $acrCreds.passwords[0].value
Write-Host "  ACR admin user ready" -ForegroundColor Green
Write-Host ""

# ----------------------------------------------------------------
# 4. Create Web App if it does not exist
# ----------------------------------------------------------------
Write-Host "[5/7] Checking Web App..." -ForegroundColor Yellow
$webAppExists = az webapp show --name $WebAppName --resource-group $ResourceGroup 2>$null
if (-not $webAppExists) {
    Write-Host "  Creating Web App: $WebAppName" -ForegroundColor Yellow
    az webapp create `
        --resource-group $ResourceGroup `
        --plan $AppServicePlanName `
        --name $WebAppName `
        --deployment-container-image-name $FullImageName
    Write-Host "  Web App created" -ForegroundColor Green
} else {
    Write-Host "  Web App exists" -ForegroundColor Green
}
Write-Host ""

# ----------------------------------------------------------------
# 5. Point App Service at the new image
# ----------------------------------------------------------------
Write-Host "[6/7] Configuring container and environment variables..." -ForegroundColor Yellow

az webapp config container set `
    --name $WebAppName `
    --resource-group $ResourceGroup `
    --docker-custom-image-name $FullImageName `
    --docker-registry-server-url "https://$acrServer" `
    --docker-registry-server-user $acrUser `
    --docker-registry-server-password $acrPass | Out-Null
Write-Host "  Container image configured" -ForegroundColor Green

# ----------------------------------------------------------------
# 6. Load .env and apply as App Settings
# ----------------------------------------------------------------
# Start with the port setting so App Service routes traffic correctly
$appSettings = @("WEBSITES_PORT=8000")

$envFilePath = "$ScriptDir\.env"
if (Test-Path $envFilePath) {
    Write-Host "  Reading .env from $envFilePath" -ForegroundColor Gray
    foreach ($line in (Get-Content $envFilePath)) {
        # Skip blank lines and comments
        if ($line -match '^\s*$' -or $line -match '^\s*#') { continue }
        if ($line -match '^([^=]+)=(.*)$') {
            $key   = $matches[1].Trim()
            $value = $matches[2].Trim() -replace '^["\x27]|["\x27]$', ''
            # Skip PORT / BACKEND_PORT - we use WEBSITES_PORT above
            if ($key -eq "PORT" -or $key -eq "BACKEND_PORT") { continue }
            $appSettings += "$key=$value"
            Write-Host "    + $key" -ForegroundColor Gray
        }
    }
    Write-Host "  Loaded $($appSettings.Count - 1) variables from .env" -ForegroundColor Green
} else {
    Write-Host "  WARNING: .env not found at $envFilePath" -ForegroundColor Yellow
    Write-Host "  Continuing with WEBSITES_PORT only - add secrets in Azure Portal" -ForegroundColor Yellow
}

# In production the frontend is served by the same host, so extend CORS to include the App Service URL.
# Remove any existing CORS_ORIGINS entry loaded from .env and replace it.
$corsEntry = $appSettings | Where-Object { $_ -match '^CORS_ORIGINS=' }
if ($corsEntry) {
    $existingOrigins = ($corsEntry -split '=', 2)[1]
    $appSettings = $appSettings | Where-Object { $_ -notmatch '^CORS_ORIGINS=' }
    $appSettings += "CORS_ORIGINS=$existingOrigins,$AppUrl"
} else {
    $appSettings += "CORS_ORIGINS=$AppUrl"
}

az webapp config appsettings set `
    --name $WebAppName `
    --resource-group $ResourceGroup `
    --settings $appSettings | Out-Null
Write-Host "  App settings applied" -ForegroundColor Green
Write-Host ""

# ----------------------------------------------------------------
# 7. Enable CD webhook and restart
# ----------------------------------------------------------------
Write-Host "[7/7] Enabling continuous deployment and restarting..." -ForegroundColor Yellow
az webapp deployment container config `
    --name $WebAppName `
    --resource-group $ResourceGroup `
    --enable-cd true | Out-Null

az webapp restart --name $WebAppName --resource-group $ResourceGroup
Write-Host "  Web app restarted" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Green
Write-Host " DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  App URL  : $AppUrl" -ForegroundColor Cyan
Write-Host "  Health   : $AppUrl/api/health" -ForegroundColor Cyan
Write-Host "  API docs : $AppUrl/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Tail logs: az webapp log tail --name $WebAppName --resource-group $ResourceGroup" -ForegroundColor Gray
Write-Host ""

Set-Location $ScriptDir

