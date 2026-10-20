$tempDir = Join-Path $env:TEMP "zeno-gh-pages"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
Copy-Item -Recurse "website/dist" $tempDir
Push-Location $tempDir
try {
    git init -b gh-pages
    git config user.name "Goddev-Archer"
    git config user.email "dev@zeno.local"
    git add .
    git commit -m "Deploy Zeno website to GitHub Pages"
    git remote add origin "https://github.com/Goddev-Archer/Zeno.git"
    git push origin gh-pages --force
    Write-Host "Successfully pushed to origin/gh-pages!"
} finally {
    Pop-Location
    Remove-Item -Recurse -Force $tempDir
}
