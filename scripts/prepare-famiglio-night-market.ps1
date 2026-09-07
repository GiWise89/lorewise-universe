param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$sourcePath = Join-Path $ProjectRoot "public\famiglio\rebuild\market\hall.png"
$targetPath = Join-Path $ProjectRoot "public\famiglio\rebuild\market\night-hall.png"
$roninSourcePath = Join-Path $ProjectRoot "public\famiglio\rebuild\market\ronin-idle.png"
$lichSourcePath = Join-Path $ProjectRoot "public\famiglio\rebuild\market\lich-idle.png"
$roninTargetPath = Join-Path $ProjectRoot "public\famiglio\rebuild\market\ronin-idle-market.png"
$lichTargetPath = Join-Path $ProjectRoot "public\famiglio\rebuild\market\lich-idle-market.png"
$irisSourcePath = Join-Path $ProjectRoot "public\famiglio\rebuild\market\nora-bartender.png"
$irisTargetPath = Join-Path $ProjectRoot "public\famiglio\rebuild\market\iris-tintora.png"

Add-Type -AssemblyName System.Drawing

function Limit-Channel([double]$value) {
  return [Math]::Max(0, [Math]::Min(255, [int][Math]::Round($value)))
}

function Write-CompactIdleSheet([string]$inputPath, [string]$outputPath) {
  $input = [System.Drawing.Bitmap]::FromFile($inputPath)
  $frameWidth = 60
  $frameHeight = 72
  $output = New-Object System.Drawing.Bitmap ($frameWidth * 4), $frameHeight
  $graphics = [System.Drawing.Graphics]::FromImage($output)
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    for ($frame = 0; $frame -lt 4; $frame++) {
      $sourceRect = New-Object System.Drawing.Rectangle (($frame * 144) + 42), 30, $frameWidth, $frameHeight
      $targetRect = New-Object System.Drawing.Rectangle ($frame * $frameWidth), 0, $frameWidth, $frameHeight
      $graphics.DrawImage($input, $targetRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
    }
    $output.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $output.Dispose()
    $input.Dispose()
  }
}

function Write-IrisPalette([string]$inputPath, [string]$outputPath) {
  $input = [System.Drawing.Bitmap]::FromFile($inputPath)
  $output = New-Object System.Drawing.Bitmap $input.Width, $input.Height
  try {
    for ($y = 0; $y -lt $input.Height; $y++) {
      for ($x = 0; $x -lt $input.Width; $x++) {
        $pixel = $input.GetPixel($x, $y)
        if ($pixel.A -eq 0) {
          $output.SetPixel($x, $y, $pixel)
          continue
        }
        if ($pixel.B -gt ($pixel.R * 1.08) -and $pixel.B -gt ($pixel.G * 1.04)) {
          $red = Limit-Channel ($pixel.B * 0.95)
          $green = Limit-Channel ($pixel.R * 0.58 + 18)
          $blue = Limit-Channel ($pixel.B * 0.9)
          $output.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($pixel.A, $red, $green, $blue))
        } else {
          $output.SetPixel($x, $y, $pixel)
        }
      }
    }
    $output.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $output.Dispose()
    $input.Dispose()
  }
}

$source = [System.Drawing.Bitmap]::FromFile($sourcePath)
$target = New-Object System.Drawing.Bitmap $source.Width, $source.Height

try {
  for ($y = 0; $y -lt $source.Height; $y++) {
    for ($x = 0; $x -lt $source.Width; $x++) {
      $pixel = $source.GetPixel($x, $y)
      $horizontal = [Math]::Abs(($x / [Math]::Max(1, $source.Width - 1)) - 0.5) * 2
      $vertical = [Math]::Abs(($y / [Math]::Max(1, $source.Height - 1)) - 0.48) * 2
      $vignette = 1 - ([Math]::Min(1, ($horizontal * 0.18) + ($vertical * 0.12)))
      $warmLight = $pixel.R -gt 145 -and $pixel.G -gt 85 -and $pixel.B -lt 115

      if ($warmLight) {
        $red = Limit-Channel ($pixel.R * (0.82 + 0.12 * $vignette))
        $green = Limit-Channel ($pixel.G * (0.68 + 0.1 * $vignette))
        $blue = Limit-Channel ($pixel.B * 0.55 + 12)
      } else {
        $red = Limit-Channel (($pixel.R * 0.48 + $pixel.B * 0.08) * $vignette)
        $green = Limit-Channel (($pixel.G * 0.5 + $pixel.B * 0.05) * $vignette)
        $blue = Limit-Channel (($pixel.B * 0.78 + 20) * $vignette)
      }

      $target.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($pixel.A, $red, $green, $blue))
    }
  }

  $target.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $target.Dispose()
  $source.Dispose()
}

Write-Output $targetPath
Write-CompactIdleSheet $roninSourcePath $roninTargetPath
Write-CompactIdleSheet $lichSourcePath $lichTargetPath
Write-IrisPalette $irisSourcePath $irisTargetPath
Write-Output $roninTargetPath
Write-Output $lichTargetPath
Write-Output $irisTargetPath
