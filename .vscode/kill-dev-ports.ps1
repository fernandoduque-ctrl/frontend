# Encerra processos que estão em LISTENING nas portas do monorepo (API Nest + Vite).
$ErrorActionPreference = 'SilentlyContinue'
$ports = @(3001, 5173)
Write-Host "[vscode] Liberando portas: $($ports -join ', ') (API / Vite)..."
foreach ($port in $ports) {
  $seen = @{}
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $procId = $_.OwningProcess
    if ($procId -and -not $seen.ContainsKey($procId)) {
      $seen[$procId] = $true
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      Write-Host "  PID $procId encerrado (porta $port)."
    }
  }
}
Write-Host "[vscode] Concluído."
exit 0
