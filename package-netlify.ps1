Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$rootPath = (Get-Location).Path
$destZip = Join-Path $rootPath "probaho-remit-netlify.zip"
$deployZip = Join-Path $rootPath "netlify-deploy.zip"

if (Test-Path $destZip) { Remove-Item $destZip -Force }
if (Test-Path $deployZip) { Remove-Item $deployZip -Force }

$includeDirs = @("css", "data", "js", "server", "netlify", "supabase", "qa")
$includeFiles = @(
    "index.html",
    "manifest.json",
    "_redirects",
    "netlify.toml",
    "README.md",
    "PROJECT_STATE.md",
    "QA_REPORT.md",
    "DEMO_SCRIPT.md"
)

$zipStream = [System.IO.File]::Open($destZip, [System.IO.FileMode]::Create)
$archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

# Add root files
foreach ($f in $includeFiles) {
    $fullPath = Join-Path $rootPath $f
    if (Test-Path $fullPath) {
        $entryName = $f.Replace('\', '/')
        $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        $fileBytes = [System.IO.File]::ReadAllBytes($fullPath)
        $entryStream.Write($fileBytes, 0, $fileBytes.Length)
        $entryStream.Dispose()
    }
}

# Add directory trees with FORWARD SLASHES ONLY
foreach ($d in $includeDirs) {
    $dirFullPath = Join-Path $rootPath $d
    if (Test-Path $dirFullPath) {
        $allFiles = Get-ChildItem -Path $dirFullPath -Recurse -File
        foreach ($file in $allFiles) {
            $rel = $file.FullName.Substring($rootPath.Length + 1)
            $entryName = $rel.Replace('\', '/')
            $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
            $entryStream = $entry.Open()
            $fileBytes = [System.IO.File]::ReadAllBytes($file.FullName)
            $entryStream.Write($fileBytes, 0, $fileBytes.Length)
            $entryStream.Dispose()
        }
    }
}

$archive.Dispose()
$zipStream.Dispose()

Copy-Item $destZip $deployZip -Force

Write-Host "Verifying Zip Entry Slashing for Linux/Netlify compatibility..."
$readZip = [System.IO.Compression.ZipFile]::OpenRead($destZip)
$backslashCount = 0
$totalEntries = $readZip.Entries.Count

foreach ($e in $readZip.Entries) {
    if ($e.FullName -match '\\') {
        $backslashCount++
        Write-Warning "Backslash found in: $($e.FullName)"
    }
}
$readZip.Dispose()

if ($backslashCount -eq 0) {
    Write-Host "SUCCESS! All $totalEntries entries use standard forward slashes (/) for 100% Linux & Netlify compatibility."
    Get-Item $destZip | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
} else {
    Write-Error "FAILED: $backslashCount entries still contain backslashes."
}
