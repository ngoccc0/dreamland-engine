# Auto-delete comprehensive audio cleanup (NO confirmation prompt)

$basePath = "d:\dreamland-engine\public\asset\sound\sfx"

$dirsToDelete = @(
    "Footsteps_DirtyGround",
    "Footsteps_Metal",
    "Footsteps_Mud",
    "Footsteps_Tile",
    "Footsteps_Water",
    "Footsteps_Wood",
    "Items\Card and Board",
    "Items\Machines",
    "UI\sci_fi",
    "steping_sounds\digital"
)

Write-Host "Deleting directories..."
foreach ($dir in $dirsToDelete) {
    $fullPath = Join-Path $basePath $dir
    if (Test-Path $fullPath) {
        Remove-Item -Path $fullPath -Recurse -Force
        Write-Host "  [OK] $dir"
    }
}

Write-Host ""
Write-Host "Deleting unused footstep Jump files..."
$jumpDirs = @(
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump",
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Jump",
    "steping_sounds\Footsteps_Leaves\Footsteps_Leaves_Jump",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Jump",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump",
    "steping_sounds\Footsteps_Wood\Footsteps_Wood_Jump"
)

foreach ($dir in $jumpDirs) {
    $fullPath = Join-Path $basePath $dir
    if (Test-Path $fullPath) {
        Remove-Item -Path $fullPath -Recurse -Force
        Write-Host "  [OK] Deleted Jump dir: $dir"
    }
}

Write-Host ""
Write-Host "Trimming Walk footsteps to 5 per biome..."
# Keep only 01-05 of each Walk directory

$walkDirs = @(
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Walk",
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Walk",
    "steping_sounds\Footsteps_Leaves\Footsteps_Leaves_Walk",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Walk",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk",
    "steping_sounds\Footsteps_Wood\Footsteps_Wood_Walk"
)

foreach ($dir in $walkDirs) {
    $fullPath = Join-Path $basePath $dir
    if (Test-Path $fullPath) {
        $files = Get-ChildItem $fullPath -File | Sort-Object Name
        $keepCount = 5
        $files | Select-Object -Skip $keepCount | ForEach-Object {
            Remove-Item $_.FullName -Force
        }
        Write-Host "  [OK] Trimmed: $dir (kept 5 files)"
    }
}

Write-Host ""
Write-Host "Deleting Human sounds..."
$humanDir = Join-Path $basePath "Human"
if (Test-Path $humanDir) {
    Remove-Item -Path $humanDir -Recurse -Force
    Write-Host "  [OK] Deleted: Human directory"
}

Write-Host ""
Write-Host "Cleanup complete!"
