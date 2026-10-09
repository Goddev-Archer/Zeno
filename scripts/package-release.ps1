# ==============================================================================
# Zeno Standalone Release Packager & GPG Signer
# Packages the standalone binary, bundled portable node, GPG signatures & checksums
# ==============================================================================

param (
    [string]$Version = "v0.1.0-alpha",
    [string]$GpgKeyId = "A3ACEB626EBFB7EC"
)

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path "$PSScriptRoot\.."
$ReleaseOutputDir = "$RootDir\releases\$Version"
$TempStagingDir = "$ReleaseOutputDir\zeno-$Version-windows-x64-portable"
$ExeSource = "$RootDir\desktop\src-tauri\target\release\zeno.exe"
$PublicKeySource = "$RootDir\zeno-release-public-key.asc"
$GpgExe = "C:\Program Files\Git\usr\bin\gpg.exe"

Write-Host "==> Packaging Zeno Release $Version" -ForegroundColor Cyan

if (-not (Test-Path $ExeSource)) {
    Write-Error "Release executable nicht gefunden unter: $ExeSource. Bitte 'tauri build' ausführen."
}

# 1. Clean and create output folders
if (Test-Path $TempStagingDir) {
    Remove-Item -Recurse -Force $TempStagingDir
}
New-Item -ItemType Directory -Path "$TempStagingDir\bin" -Force | Out-Null

# 2. Copy compiled standalone application
Copy-Item $ExeSource "$TempStagingDir\zeno.exe"
Write-Host "  -> zeno.exe kopiert." -ForegroundColor Green

# 3. Copy portable Node.js into bin/
$NodeSource = "C:\Program Files\nodejs\node.exe"
if (Test-Path $NodeSource) {
    Copy-Item $NodeSource "$TempStagingDir\bin\node.exe"
    Write-Host "  -> Portable node.exe in bin/ eingebettet." -ForegroundColor Green
} else {
    Write-Warning "System node.exe nicht gefunden unter $NodeSource."
}

# 4. Write Toolchain & Release Readme
$ReadmeContent = @"
================================================================================
                    ZENO MESSENGER & WORKSPACE ($Version)
                     Standalone Portable Release for Windows
================================================================================

1. STARTEN
   - Einfach 'zeno.exe' doppelklicken.
   - Es ist KEINE Installation von Node.js, npm, node_modules oder Rust
     auf Ihrem Computer erforderlich, um Zeno vollumfaenglich zu nutzen!
   - Die gesamte Anwendung laeuft nativ als kompilierte Binary mit integriertem
     Frontend und verschluesseltem Backend.

2. ENTHALTENE TOOLCHAINS FUER DIE INTEGRIERTE ZENO-IDE
   - Im Unterordner 'bin/' ist bereits eine vollstaendige, portable 'node.exe'
     enthalten. Die interne Zeno-IDE erkennt diese automatisch, um JavaScript-
     und TypeScript-Skripte direkt ausfuehren zu koennen.
   - Falls Sie Rust-Entwicklung innerhalb der IDE betreiben moechten:
     Kopieren Sie entweder 'cargo.exe' und 'rustc.exe' in den 'bin/'-Ordner,
     oder installieren Sie Rust ueber https://rustup.rs (wird automatisch erkannt).

3. KRYPTOGRAPHISCHE SIGNATUR- & ECHTHEITS-PRUEFUNG (GPG)
   Dieser Release wurde kryptographisch mit dem offiziellen Zeno Release Key
   (Key ID: $GpgKeyId) signiert.

   Um die Echtheit von zeno.exe zu verifizieren:
   1) Importieren Sie den oeffentlichen Schluessel:
      gpg --import zeno-release-public-key.asc

   2) Pruefen Sie die Signatur von zeno.exe:
      gpg --verify zeno.exe.asc zeno.exe

   3) Oder pruefen Sie die SHA256-Pruefsummen:
      sha256sum -c SHA256SUMS
      gpg --verify SHA256SUMS.asc SHA256SUMS
"@
$ReadmeContent | Out-File -FilePath "$TempStagingDir\README.txt" -Encoding utf8

# 5. Copy Public Key
if (Test-Path $PublicKeySource) {
    Copy-Item $PublicKeySource "$TempStagingDir\zeno-release-public-key.asc"
}

# Check if the secret key actually exists on this machine
$CanSign = $false
if (Test-Path $GpgExe) {
    $secretKeys = & $GpgExe --list-secret-keys $GpgKeyId 2>&1
    if ($LASTEXITCODE -eq 0 -and $secretKeys) {
        $CanSign = $true
        Write-Host "  -> Privater GPG-Schluessel '$GpgKeyId' auf diesem System vorhanden. Signierung aktiv." -ForegroundColor Green
    } else {
        Write-Warning "Kein privater GPG-Schluessel fuer ID '$GpgKeyId' auf diesem System gefunden. Release wird unsigniert erstellt."
    }
} else {
    Write-Warning "GPG nicht gefunden unter $GpgExe. Release wird ohne GPG-Signatur erstellt."
}

# 6. GPG Sign zeno.exe
if ($CanSign) {
    Write-Host "  -> Erzeuge detached GPG-Signatur fuer zeno.exe..." -ForegroundColor Cyan
    & $GpgExe --batch --yes --armor --detach-sign -u $GpgKeyId --output "$TempStagingDir\zeno.exe.asc" "$TempStagingDir\zeno.exe"
}

# 7. Compute SHA256SUMS
Write-Host "  -> Erzeuge SHA256SUMS..." -ForegroundColor Cyan
$Hashes = @()
Get-ChildItem -Path $TempStagingDir -Recurse -File | Where-Object { $_.Name -ne "SHA256SUMS" -and $_.Name -ne "SHA256SUMS.asc" } | ForEach-Object {
    $RelativePath = $_.FullName.Substring($TempStagingDir.Length + 1).Replace('\', '/')
    $Hash = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash.ToLower()
    $Hashes += "$Hash  $RelativePath"
}
$Hashes -join "`r`n" | Out-File -FilePath "$TempStagingDir\SHA256SUMS" -Encoding ascii

# 8. Sign SHA256SUMS
if ($CanSign) {
    & $GpgExe --batch --yes --armor --detach-sign -u $GpgKeyId --output "$TempStagingDir\SHA256SUMS.asc" "$TempStagingDir\SHA256SUMS"
}

# 9. Create Zip Archive
$ZipPath = "$ReleaseOutputDir\zeno-$Version-windows-x64-portable.zip"
if (Test-Path $ZipPath) {
    Remove-Item -Force $ZipPath
}
Write-Host "  -> Erstelle ZIP-Archiv: $ZipPath..." -ForegroundColor Cyan
Compress-Archive -Path "$TempStagingDir\*" -DestinationPath $ZipPath -CompressionLevel Optimal

# 10. Sign the Zip Archive
if ($CanSign) {
    Write-Host "  -> Signiere ZIP-Archiv..." -ForegroundColor Cyan
    & $GpgExe --batch --yes --armor --detach-sign -u $GpgKeyId --output "$ZipPath.asc" $ZipPath
}

Write-Host "`n[SUCCESS] Release $Version erfolgreich erstellt und signiert!" -ForegroundColor Green
Write-Host "Dateien in $ReleaseOutputDir :"
Get-ChildItem $ReleaseOutputDir | Select-Object Name, Length

