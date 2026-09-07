Add-Type -AssemblyName System.Drawing

$marketRoot = Join-Path $PSScriptRoot "..\public\famiglio\rebuild\market"
$merchantIds = @("nora", "mirra", "iris", "ronin", "lich")

foreach ($merchantId in $merchantIds) {
  $sourcePath = Join-Path $marketRoot "$merchantId-idle-v2.png"
  $targetPath = Join-Path $marketRoot "$merchantId-idle-v3.png"
  $source = [System.Drawing.Bitmap]::FromFile($sourcePath)
  try {
    $lowResolution = New-Object System.Drawing.Bitmap 256, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($lowResolution)
      try {
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighSpeed
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.DrawImage($source, 0, 0, 256, 64)
      } finally {
        $graphics.Dispose()
      }

      $target = New-Object System.Drawing.Bitmap 512, 128, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      try {
        $graphics = [System.Drawing.Graphics]::FromImage($target)
        try {
          $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
          $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighSpeed
          $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
          $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
          $graphics.DrawImage($lowResolution, 0, 0, 512, 128)
        } finally {
          $graphics.Dispose()
        }
        $target.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
      } finally {
        $target.Dispose()
      }
    } finally {
      $lowResolution.Dispose()
    }
  } finally {
    $source.Dispose()
  }

  Write-Output "Prepared $targetPath"
}
