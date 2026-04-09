<#
.SYNOPSIS
    Mescla a branch dev na main e envia para origin (repositório frontend).

.DESCRIPTION
    fetch -> checkout main -> pull -> merge dev -> push origin main -> checkout dev
    Raiz do repo: pasta pai de scripts/ por padrão.

.EXAMPLE
    .\scripts\merge-dev-to-main.ps1

.EXAMPLE
    .\scripts\merge-dev-to-main.ps1 -RepoRoot "C:\projects\mvp\frontend"
#>
param(
    [string]$RepoRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot '.git'))) {
    throw "Não é um repositório Git: $RepoRoot"
}

Set-Location -LiteralPath $RepoRoot

function Invoke-Git {
    param([Parameter(Mandatory)][string[]]$GitArgs)
    & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') saiu com código $LASTEXITCODE"
    }
}

Write-Host "Repo: $RepoRoot" -ForegroundColor Cyan

Invoke-Git @('fetch', 'origin')
Invoke-Git @('checkout', 'main')
Invoke-Git @('pull', 'origin', 'main')
Invoke-Git @('merge', 'dev', '-m', "Merge branch 'dev' into main")
Invoke-Git @('push', 'origin', 'main')
Invoke-Git @('checkout', 'dev')

Write-Host "Concluído: main atualizada e enviada para origin; branch atual: dev." -ForegroundColor Green
