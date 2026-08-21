$ErrorActionPreference = 'Stop'

$projectPath = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectPath '.env.local'
$tmpPath = Join-Path $projectPath '.tmp'
$stripeOut = Join-Path $tmpPath 'game-e2e-stripe.out.log'
$stripeErr = Join-Path $tmpPath 'game-e2e-stripe.err.log'

New-Item -ItemType Directory -Force -Path $tmpPath | Out-Null

$secretKeyLine = Get-Content -LiteralPath $envPath |
  Where-Object { $_ -match '^STRIPE_SECRET_KEY=' } |
  Select-Object -First 1

if (-not $secretKeyLine) {
  throw 'STRIPE_SECRET_KEY mancante in .env.local.'
}

$env:STRIPE_API_KEY = $secretKeyLine.Substring($secretKeyLine.IndexOf('=') + 1).Trim()

$stripeCommand = Get-Command stripe -ErrorAction Stop
Remove-Item -LiteralPath $stripeOut, $stripeErr -Force -ErrorAction SilentlyContinue

$stripeProcess = Start-Process `
  -FilePath $stripeCommand.Source `
  -ArgumentList @('listen', '--forward-to', 'http://localhost:3001/api/stripe/webhook') `
  -WorkingDirectory $projectPath `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stripeOut `
  -RedirectStandardError $stripeErr `
  -PassThru

try {
  $webhookSecret = $null

  for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
    Start-Sleep -Milliseconds 500
    $listenerOutput = (
      (Get-Content -LiteralPath $stripeOut -Raw -ErrorAction SilentlyContinue) +
      "`n" +
      (Get-Content -LiteralPath $stripeErr -Raw -ErrorAction SilentlyContinue)
    )

    if ($listenerOutput -match '(whsec_[A-Za-z0-9]+)') {
      $webhookSecret = $matches[1]
      break
    }

    if ($stripeProcess.HasExited) {
      throw 'Il listener Stripe TEST si e arrestato prima di essere pronto.'
    }
  }

  if (-not $webhookSecret) {
    throw 'Il listener Stripe TEST non ha fornito una firma webhook.'
  }

  $env:STRIPE_WEBHOOK_SECRET = $webhookSecret
  Write-Output "STRIPE_TEST_READY PID=$($stripeProcess.Id)"

  & npm.cmd run dev -- --host localhost --port 3001
}
finally {
  if (-not $stripeProcess.HasExited) {
    Stop-Process -Id $stripeProcess.Id -Force
  }
}
