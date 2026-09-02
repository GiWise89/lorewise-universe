$ErrorActionPreference = "Stop"

$ruleName = "LoreWise Famiglio anteprima LAN 3016"
$nodeProgram = "C:\Users\Luigi\AppData\Local\OpenAI\Codex\runtimes\cua_node\f8d2abcb7481383b\bin\node.exe"

$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($null -eq $existingRule) {
  New-NetFirewallRule `
    -DisplayName $ruleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 3016 `
    -RemoteAddress LocalSubnet `
    -Profile Public `
    -Program $nodeProgram | Out-Null
} else {
  Set-NetFirewallRule -DisplayName $ruleName -Enabled True -Action Allow -Profile Public
}

Write-Host "Anteprima Famiglio abilitata sulla rete locale." -ForegroundColor Green
Start-Sleep -Seconds 5
