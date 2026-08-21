param(
  [string]$SourceDirectory = (Join-Path $PSScriptRoot "..\Vetrina Disegni"),
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\public\artworks\previews"),
  [string]$ManifestPath = (Join-Path $PSScriptRoot "artwork-source-map.json"),
  [string[]]$CatalogCodes = @(),
  [ValidateRange(0, 255)][int]$WatermarkLightAlpha = 82,
  [ValidateRange(0, 255)][int]$WatermarkDarkAlpha = 54,
  [ValidateRange(0, 255)][int]$StampLightAlpha = 128,
  [ValidateRange(0, 255)][int]$StampDarkAlpha = 92
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path -LiteralPath $SourceDirectory)) {
  throw "Cartella sorgente non trovata: $SourceDirectory"
}

$catalogEntries = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
$supportedExtensions = @(".png", ".jpg", ".jpeg", ".webp")
$sourceFiles = @(Get-ChildItem -LiteralPath $SourceDirectory -File | Where-Object { $_.Extension.ToLowerInvariant() -in $supportedExtensions })

$duplicateCodes = $catalogEntries | Group-Object code | Where-Object Count -gt 1
$duplicateFiles = $catalogEntries | Group-Object file | Where-Object Count -gt 1
if ($duplicateCodes -or $duplicateFiles) {
  throw "La mappa delle opere contiene codici o file duplicati."
}

$sourceNames = @($sourceFiles.Name | Sort-Object)
$mappedNames = @($catalogEntries.file | Sort-Object)
$unmappedFiles = @($sourceNames | Where-Object { $_ -notin $mappedNames })
$missingFiles = @($mappedNames | Where-Object { $_ -notin $sourceNames })
if ($unmappedFiles.Count -gt 0 -or $missingFiles.Count -gt 0) {
  throw "Mappa non allineata. Non mappati: $($unmappedFiles -join ', '). Mancanti: $($missingFiles -join ', ')."
}

$selectedEntries = if ($CatalogCodes.Count -gt 0) {
  @($catalogEntries | Where-Object { $_.code -in $CatalogCodes })
} else {
  $catalogEntries
}
if ($selectedEntries.Count -ne $(if ($CatalogCodes.Count -gt 0) { $CatalogCodes.Count } else { $catalogEntries.Count })) {
  throw "Uno o piu codici richiesti non sono presenti nella mappa."
}

$hashesBefore = @{}
foreach ($file in $sourceFiles) {
  $hashesBefore[$file.FullName] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$jpegCodec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq "image/jpeg"
$qualityEncoder = [Drawing.Imaging.Encoder]::Quality
$copyrightText = "LOREWISE UNIVERSE  |  GIWISE STUDIO  |  ANTEPRIMA PROTETTA"
foreach ($entry in $selectedEntries) {
  $file = Get-Item -LiteralPath (Join-Path $SourceDirectory $entry.file)
  $catalogCode = $entry.code
  $sourceImage = [Drawing.Image]::FromFile($file.FullName)
  try {
    $scale = [Math]::Min(1.0, 1600.0 / [Math]::Max($sourceImage.Width, $sourceImage.Height))
    $targetWidth = [Math]::Max(1, [int][Math]::Round($sourceImage.Width * $scale))
    $targetHeight = [Math]::Max(1, [int][Math]::Round($sourceImage.Height * $scale))
    $preview = [Drawing.Bitmap]::new($targetWidth, $targetHeight, [Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
      $graphics = [Drawing.Graphics]::FromImage($preview)
      try {
        $graphics.Clear([Drawing.Color]::FromArgb(255, 247, 237))
        $graphics.CompositingQuality = [Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $targetWidth, $targetHeight)

        $fontSize = [Math]::Max(22, [int]($targetWidth / 31))
        $watermarkFont = [Drawing.Font]::new("Arial", $fontSize, [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
        $smallFont = [Drawing.Font]::new("Arial", [Math]::Max(17, [int]($targetWidth / 49)), [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
        # La trama diagonale tutela l'anteprima senza coprire i dettagli dell'opera.
        # La firma inferiore resta più leggibile come secondo livello di protezione.
        $lightBrush = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb($WatermarkLightAlpha, 255, 255, 255))
        $darkBrush = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb($WatermarkDarkAlpha, 23, 37, 84))
        $stampLightBrush = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb($StampLightAlpha, 255, 255, 255))
        $stampDarkBrush = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb($StampDarkAlpha, 23, 37, 84))
        try {
          $graphics.TranslateTransform($targetWidth / 2, $targetHeight / 2)
          $graphics.RotateTransform(-24)
          $graphics.TranslateTransform(-$targetWidth / 2, -$targetHeight / 2)
          $textSize = $graphics.MeasureString($copyrightText, $watermarkFont)
          $rowStep = [Math]::Max(230, [int]($targetHeight / 3.2))
          for ($y = -$targetHeight; $y -lt ($targetHeight * 2); $y += $rowStep) {
            for ($x = -$targetWidth; $x -lt ($targetWidth * 2); $x += [int]($textSize.Width + 140)) {
              $graphics.DrawString($copyrightText, $watermarkFont, $darkBrush, $x + 3, $y + 3)
              $graphics.DrawString($copyrightText, $watermarkFont, $lightBrush, $x, $y)
            }
          }
          $graphics.ResetTransform()
          $stamp = "(C) GIWISE STUDIO | LOREWISE UNIVERSE"
          $stampSize = $graphics.MeasureString($stamp, $smallFont)
          $stampX = [Math]::Max(18, $targetWidth - $stampSize.Width - 24)
          $stampY = [Math]::Max(18, $targetHeight - $stampSize.Height - 22)
          $graphics.DrawString($stamp, $smallFont, $stampDarkBrush, $stampX + 2, $stampY + 2)
          $graphics.DrawString($stamp, $smallFont, $stampLightBrush, $stampX, $stampY)
        }
        finally {
          $watermarkFont.Dispose()
          $smallFont.Dispose()
          $lightBrush.Dispose()
          $darkBrush.Dispose()
          $stampLightBrush.Dispose()
          $stampDarkBrush.Dispose()
        }
      }
      finally {
        $graphics.Dispose()
      }

      $publicName = "$($catalogCode.ToLowerInvariant())-preview.jpg"
      $destination = Join-Path $OutputDirectory $publicName
      $encoderParameters = [Drawing.Imaging.EncoderParameters]::new(1)
      try {
        $encoderParameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new($qualityEncoder, [long]88)
        $preview.Save($destination, $jpegCodec, $encoderParameters)
      }
      finally {
        $encoderParameters.Dispose()
      }
      Write-Output "$catalogCode`t$($file.Name)`t$publicName`t${targetWidth}x${targetHeight}"
    }
    finally {
      $preview.Dispose()
    }
  }
  finally {
    $sourceImage.Dispose()
  }
}

foreach ($file in $sourceFiles) {
  $hashAfter = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
  if ($hashAfter -ne $hashesBefore[$file.FullName]) {
    throw "Il file originale è cambiato: $($file.FullName)"
  }
}

Write-Output "ORIGINALS_VERIFIED=$($sourceFiles.Count)"
Write-Output "PREVIEWS_GENERATED=$($selectedEntries.Count)"
