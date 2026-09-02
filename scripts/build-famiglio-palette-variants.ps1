param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$publicRoot = Join-Path $ProjectRoot 'public\famiglio'
$sourceRoot = Join-Path $ProjectRoot 'tamagochi asset\lavorazione'
$paletteRoot = Join-Path $publicRoot 'palettes'

function Ensure-Parent([string]$Path) {
  $parent = Split-Path -Parent $Path
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
}

function Clamp-Byte([double]$Value) {
  return [byte][Math]::Max(0, [Math]::Min(255, [Math]::Round($Value)))
}

function Convert-PaletteImage([string]$InputPath, [string]$OutputPath, [string]$Mode) {
  Ensure-Parent $OutputPath
  $source = [System.Drawing.Bitmap]::FromFile($InputPath)
  $output = New-Object System.Drawing.Bitmap $source.Width, $source.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    for ($y = 0; $y -lt $source.Height; $y++) {
      for ($x = 0; $x -lt $source.Width; $x++) {
        $pixel = $source.GetPixel($x, $y)
        if ($pixel.A -eq 0) { continue }
        $luma = 0.299 * $pixel.R + 0.587 * $pixel.G + 0.114 * $pixel.B
        $r = $pixel.R; $g = $pixel.G; $b = $pixel.B
        switch ($Mode) {
          'dog-moonlit' {
            $r = 0.64 * $luma + 30; $g = 0.78 * $luma + 42; $b = 0.92 * $luma + 58
          }
          'dog-cocoa' {
            $r = 0.86 * $luma + 28; $g = 0.48 * $luma + 12; $b = 0.30 * $luma + 9
          }
          'crow-spectral' {
            $isGold = $pixel.R -gt 75 -and $pixel.G -gt 45 -and $pixel.B -lt 70 -and $pixel.R -gt ($pixel.B * 1.5)
            if (-not $isGold) {
              if ($luma -lt 18) { $r = 12; $g = 18; $b = 29 }
              else { $r = 0.74 * $luma + 62; $g = 0.86 * $luma + 72; $b = $luma + 88 }
            }
          }
          'crow-arcane' {
            $isGold = $pixel.R -gt 75 -and $pixel.G -gt 45 -and $pixel.B -lt 70 -and $pixel.R -gt ($pixel.B * 1.5)
            if (-not $isGold) { $r = 0.92 * $luma + 34; $g = 0.34 * $luma + 7; $b = $luma + 52 }
          }
          'fox-arctic' {
            $isCoat = $pixel.R -gt 65 -and $pixel.R -gt ($pixel.G * 1.15) -and $pixel.R -gt ($pixel.B * 1.35)
            if ($isCoat) { $r = 0.86 * $luma + 58; $g = 0.94 * $luma + 68; $b = $luma + 82 }
          }
          'fox-silver' {
            $isCoat = $pixel.R -gt 65 -and $pixel.R -gt ($pixel.G * 1.15) -and $pixel.R -gt ($pixel.B * 1.35)
            if ($isCoat) { $r = 0.61 * $luma + 21; $g = 0.68 * $luma + 27; $b = 0.78 * $luma + 39 }
          }
        }
        $output.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($pixel.A, (Clamp-Byte $r), (Clamp-Byte $g), (Clamp-Byte $b)))
      }
    }
    $output.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $output.Dispose()
    $source.Dispose()
  }
}

function Copy-VariantFile([string]$InputPath, [string]$OutputPath) {
  Ensure-Parent $OutputPath
  Copy-Item -LiteralPath $InputPath -Destination $OutputPath -Force
}

$catVariants = @(
  @{ Id = 'cat-umbra'; Number = 2 },
  @{ Id = 'cat-luna'; Number = 5 }
)
foreach ($variant in $catVariants) {
  $catDir = Join-Path $sourceRoot "sorgenti\Pet Cats Pack\Cat-$($variant.Number)"
  $target = Join-Path $paletteRoot $variant.Id
  Copy-VariantFile (Join-Path $sourceRoot "sprite-generati\cat-$($variant.Number)-azioni-composte-50px-final.png") (Join-Path $target 'sprite.png')
  Copy-VariantFile (Join-Path $catDir "Cat-$($variant.Number)-Idle.png") (Join-Path $target 'idle.png')
  Copy-VariantFile (Join-Path $catDir "Cat-$($variant.Number)-Walk.png") (Join-Path $target 'walk.png')
  Copy-VariantFile (Join-Path $catDir "Cat-$($variant.Number)-Sitting.png") (Join-Path $target 'sit.png')
  Copy-VariantFile (Join-Path $catDir "Cat-$($variant.Number)-Licking 1.png") (Join-Path $target 'groom.png')
  Copy-VariantFile (Join-Path $catDir "Cat-$($variant.Number)-Sleeping2.png") (Join-Path $target 'sleep.png')
}

$wolfVariants = @('wolf-winterborn', 'wolf-bloodmoon')
foreach ($variantId in $wolfVariants) {
  $slug = $variantId.Replace('wolf-', '')
  $target = Join-Path $paletteRoot $variantId
  Copy-VariantFile (Join-Path $sourceRoot "sprite-generati\$variantId-azioni-composte-48px-final.png") (Join-Path $target 'sprite.png')
  Copy-VariantFile (Join-Path $sourceRoot "sorgenti\Wolves\wolf-colorways\wolf-$slug.png") (Join-Path $target 'behaviors.png')
}

$dogInputs = @('sprite.png', 'idle.png', 'walk.png', 'sit.png', 'groom.png', 'sleep.png')
foreach ($mode in @('dog-moonlit', 'dog-cocoa')) {
  foreach ($file in $dogInputs) {
    $input = if ($file -eq 'sprite.png') { Join-Path $publicRoot 'sprites\dog-golden-retriever-azioni-composte-100px-final.png' } else { Join-Path $publicRoot "behaviors\golden\$file" }
    Convert-PaletteImage $input (Join-Path $paletteRoot "$mode\$file") $mode
  }
}

foreach ($mode in @('crow-spectral', 'crow-arcane')) {
  Convert-PaletteImage (Join-Path $publicRoot 'sprites\crow-azioni-composte-48px-final.png') (Join-Path $paletteRoot "$mode\sprite.png") $mode
  Convert-PaletteImage (Join-Path $publicRoot 'behaviors\wild\crow.png') (Join-Path $paletteRoot "$mode\behaviors.png") $mode
}

foreach ($mode in @('fox-arctic', 'fox-silver')) {
  Convert-PaletteImage (Join-Path $publicRoot 'sprites\fox-azioni-composte-32px-final.png') (Join-Path $paletteRoot "$mode\sprite.png") $mode
  Convert-PaletteImage (Join-Path $publicRoot 'behaviors\wild\fox.png') (Join-Path $paletteRoot "$mode\behaviors.png") $mode
}

Write-Output "Famiglio palette variants generated in $paletteRoot"
