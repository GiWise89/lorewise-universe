$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$npcRoot = Join-Path $PSScriptRoot '../source-assets/campaign-npcs-v3'
New-Item -ItemType Directory -Force -Path $npcRoot | Out-Null
$npcNames = @('Goblin','Lizardfolk','Skeleton','Orc','Ronin','Samurai','Tengu','Oni','Dryad','Wizard','Medusa','Paladin','AnubisWarrior','Ogre','Efreet','DeathKnight','Vampire','Lich','Demon','Planetar')
$npcArchive = [IO.Compression.ZipFile]::OpenRead((Join-Path $PSScriptRoot '../tamagochi asset/Fantasy RPG monster pack (by Franuka).zip'))
try {
  foreach ($npcName in $npcNames) {
    $npcDirectory = Join-Path $npcRoot $npcName
    New-Item -ItemType Directory -Force -Path $npcDirectory | Out-Null
    foreach ($npcEntry in $npcArchive.Entries) {
      if ($npcEntry.FullName -match "^1x/[^/]+/${npcName}_(idle|walk|move|fly|attack|attack_NOhitbox|hit|die|death)\.png$") {
        [IO.Compression.ZipFileExtensions]::ExtractToFile($npcEntry, (Join-Path $npcDirectory $npcEntry.Name), $true)
      }
    }
  }
} finally { $npcArchive.Dispose() }
Write-Output 'Extracted 20 distinct original NPC animation sources.'
$cloudRoot = Join-Path $PSScriptRoot '../public/famiglio/rebuild/effects/cloud-variants-v3'
New-Item -ItemType Directory -Force -Path $cloudRoot | Out-Null
$cloudArchive = [IO.Compression.ZipFile]::OpenRead('C:/Users/Luigi/Documents/asset game/GandalfHardcore FREE Platformer Assets.zip')
try {
  foreach ($cloudEntry in $cloudArchive.Entries) {
    if ($cloudEntry.FullName -match '/cloud[1-6]\.png$') {
      [IO.Compression.ZipFileExtensions]::ExtractToFile($cloudEntry, (Join-Path $cloudRoot $cloudEntry.Name), $true)
    }
  }
} finally { $cloudArchive.Dispose() }
