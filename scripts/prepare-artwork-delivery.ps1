param(
  [string]$Code = "LW-ART-003",
  [string]$SourceFile = "Vetrina Disegni\bad life1.png",
  [string]$Title = "Legami Infernali",
  [string]$Year = "2025"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = [IO.Path]::GetFullPath((Join-Path $projectRoot $SourceFile))
$deliveryRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot "output\artwork-deliveries\$Code"))
$stagingPath = Join-Path $deliveryRoot "staging"

if (-not $sourcePath.StartsWith([IO.Path]::GetFullPath((Join-Path $projectRoot "Vetrina Disegni")), [StringComparison]::OrdinalIgnoreCase)) {
  throw "La sorgente deve restare nella cartella Vetrina Disegni."
}
if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Sorgente non trovata: $sourcePath" }
if (Test-Path -LiteralPath $stagingPath) { Remove-Item -LiteralPath $stagingPath -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stagingPath | Out-Null

$sourceHashBefore = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
Add-Type -AssemblyName System.Drawing

function Save-Jpeg([System.Drawing.Bitmap]$bitmap, [string]$path, [long]$quality = 95) {
  $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq "image/jpeg"
  $parameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
  $parameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, $quality)
  try { $bitmap.Save($path, $encoder, $parameters) } finally { $parameters.Dispose() }
}

function Draw-Contained([System.Drawing.Graphics]$graphics, [System.Drawing.Image]$image, [int]$width, [int]$height, [double]$coverage = 0.9) {
  $scale = [Math]::Min(($width * $coverage) / $image.Width, ($height * $coverage) / $image.Height)
  $drawWidth = [int]($image.Width * $scale)
  $drawHeight = [int]($image.Height * $scale)
  $x = [int](($width - $drawWidth) / 2)
  $y = [int](($height - $drawHeight) / 2)
  $destination = [System.Drawing.Rectangle]::new($x, $y, $drawWidth, $drawHeight)
  $graphics.DrawImage($image, $destination, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel)
}

$source = [System.Drawing.Image]::FromFile($sourcePath)
try {
  $flat = [System.Drawing.Bitmap]::new($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  try {
    if ($source.HorizontalResolution -gt 0 -and $source.VerticalResolution -gt 0) {
      $flat.SetResolution($source.HorizontalResolution, $source.VerticalResolution)
    }
    $graphics = [System.Drawing.Graphics]::FromImage($flat)
    try {
      $graphics.Clear([System.Drawing.Color]::White)
      $destination = [System.Drawing.Rectangle]::new(0, 0, $source.Width, $source.Height)
      $graphics.DrawImage($source, $destination, 0, 0, $source.Width, $source.Height, [System.Drawing.GraphicsUnit]::Pixel)
    } finally { $graphics.Dispose() }
    $pngPath = Join-Path $stagingPath "$Code-$Title-MASTER.png"
    $jpgPath = Join-Path $stagingPath "$Code-$Title-compatibilita.jpg"
    Copy-Item -LiteralPath $sourcePath -Destination $pngPath
    Save-Jpeg $flat $jpgPath 100
  } finally { $flat.Dispose() }

  $desktop = [System.Drawing.Bitmap]::new(2560, 1440, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($desktop)
    try {
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Rectangle]::new(0,0,2560,1440), [System.Drawing.Color]::FromArgb(26,8,31), [System.Drawing.Color]::FromArgb(92,20,69), 25)
      try { $graphics.FillRectangle($brush, 0, 0, 2560, 1440) } finally { $brush.Dispose() }
      Draw-Contained $graphics $source 2560 1440 0.92
    } finally { $graphics.Dispose() }
    Save-Jpeg $desktop (Join-Path $stagingPath "$Code-sfondo-desktop-2560x1440.jpg") 94
  } finally { $desktop.Dispose() }

  $phone = [System.Drawing.Bitmap]::new(1440, 2560, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($phone)
    try {
      $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Rectangle]::new(0,0,1440,2560), [System.Drawing.Color]::FromArgb(26,8,31), [System.Drawing.Color]::FromArgb(92,20,69), 90)
      try { $graphics.FillRectangle($brush, 0, 0, 1440, 2560) } finally { $brush.Dispose() }
      Draw-Contained $graphics $source 1440 2560 0.96
    } finally { $graphics.Dispose() }
    Save-Jpeg $phone (Join-Path $stagingPath "$Code-sfondo-smartphone-1440x2560.jpg") 94
  } finally { $phone.Dispose() }
} finally { $source.Dispose() }

$licenseText = @"
LOREWISE UNIVERSE - GIWISE STUDIO
LICENZA PERSONALE DIGITALE

Opera: $Title
Codice opera: $Code
Anno: $Year

Il certificato nominativo con intestatario, riferimento d'ordine e identificativo
univoco della licenza viene generato separatamente nell'Area personale LoreWise ID.

La licenza e personale, non esclusiva e non trasferibile. Il diritto d'autore e la proprieta intellettuale restano a GiWise Studio.

USI CONSENTITI
- Conservazione sui dispositivi personali e utilizzo come sfondo.
- Fino a 3 stampe fisiche esclusivamente personali.
- Versione ridotta come immagine profilo con attribuzione a GiWise Studio.

USI VIETATI
- Rivendita, redistribuzione o pubblicazione del file in piena risoluzione.
- Merchandising, pubblicita, loghi o altri impieghi commerciali.
- NFT, sublicenze o trasferimento ad altre persone.
- Addestramento di sistemi di intelligenza artificiale o inserimento in dataset.
- Rimozione della firma o delle informazioni sul diritto d'autore.

Queste sono le condizioni d'uso comuni. Il certificato nominativo associato
all'acquisto costituisce il documento specifico della singola licenza.
"@
Set-Content -LiteralPath (Join-Path $stagingPath "CONDIZIONI-LICENZA-PERSONALE.txt") -Value $licenseText -Encoding UTF8

$readmeText = @"
$Title - Edizione Premium LoreWise Universe

CONTENUTO
- PNG appiattito alla risoluzione nativa 2480 x 3508 px
- JPG ad alta qualita per compatibilita (copia derivata e compressa)
- Sfondo desktop 2560 x 1440 px
- Sfondo smartphone 1440 x 2560 px
- Condizioni della licenza personale

DOCUMENTO NOMINATIVO
Il certificato digitale personale non e incluso in questo archivio comune.
Viene creato per il singolo acquirente ed e scaricabile separatamente dalla sua
Area personale LoreWise ID dopo la conferma dell'ordine.

Il pacchetto non contiene livelli, file di lavorazione o la sorgente originale dell'archivio GiWise Studio.
Assistenza: lorewise.archive@gmail.com
"@
Set-Content -LiteralPath (Join-Path $stagingPath "LEGGIMI.txt") -Value $readmeText -Encoding UTF8

$manifest = Get-ChildItem -LiteralPath $stagingPath -File | Sort-Object Name | ForEach-Object {
  [PSCustomObject]@{ file = $_.Name; size = $_.Length; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }
}
$manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $stagingPath "MANIFEST-SHA256.json") -Encoding UTF8
$masterHash = (Get-FileHash -LiteralPath (Join-Path $stagingPath "$Code-$Title-MASTER.png") -Algorithm SHA256).Hash
if ($masterHash -ne $sourceHashBefore) { throw "Il PNG master non corrisponde byte-per-byte alla sorgente originale." }
$archivePath = Join-Path $deliveryRoot "$Code-pacchetto-premium-collaudo.zip"
if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath -Force }
Compress-Archive -Path (Join-Path $stagingPath "*") -DestinationPath $archivePath -CompressionLevel Optimal

$sourceHashAfter = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
if ($sourceHashBefore -ne $sourceHashAfter) { throw "La sorgente originale risulta modificata: operazione interrotta." }
$archive = Get-Item -LiteralPath $archivePath
[PSCustomObject]@{
  code = $Code
  source = $sourcePath
  sourceUntouched = $true
  sourceSha256 = $sourceHashAfter
  package = $archive.FullName
  packageSize = $archive.Length
  packageSha256 = (Get-FileHash -LiteralPath $archive.FullName -Algorithm SHA256).Hash
  certificateDelivery = "Separata e nominativa tramite Area personale LoreWise ID"
} | ConvertTo-Json
