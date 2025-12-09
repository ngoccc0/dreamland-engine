# Cleanup unused audio assets for Dreamland Engine
param([switch]$Force = $false)

$baseDir = "D:\dreamland-engine\public\asset\sound"

$deleteDirs = @(
    "$baseDir\sfx\steping_sounds\Footsteps_DirtyGround",
    "$baseDir\sfx\steping_sounds\Footsteps_Metal",
    "$baseDir\sfx\steping_sounds\Footsteps_Mud",
    "$baseDir\sfx\steping_sounds\Footsteps_Tile",
    "$baseDir\sfx\steping_sounds\Footsteps_Water",
    "$baseDir\sfx\steping_sounds\digital",
    "$baseDir\sfx\Items\Card and Board"
)

$deleteFiles = @(
    "$baseDir\sfx\Items\Cloth_Coat_PickUp_Stereo.wav",
    "$baseDir\sfx\Items\Cloth_Jacket_Casual_Impact_Hand_Moderate_Stereo.wav",
    "$baseDir\sfx\Items\Cloth_Winter_Coat_Throw_Moderate_Stereo.wav",
    "$baseDir\sfx\Items\Household_Closet_Key_Insertion_Stereo.wav",
    "$baseDir\sfx\Items\Household_Door_Wood_Open_Stereo.wav",
    "$baseDir\sfx\Items\Household_Window_Mechanism_Old_Solo_Stereo.wav"
)

Write-Host "Dreamland Engine Audio Cleanup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$totalSize = 0
foreach ($dir in $deleteDirs) {
    if (Test-Path $dir) {
        $size = (Get-ChildItem $dir -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
        $totalSize += $size
    }
}
foreach ($file in $deleteFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length / 1MB
        $totalSize += $size
    }
}

Write-Host "Estimated space to free: $('{0:N1}' -f $totalSize) MB" -ForegroundColor Yellow
Write-Host ""
Write-Host "Directories to delete:" -ForegroundColor Yellow
foreach ($dir in $deleteDirs) {
    if (Test-Path $dir) {
        Write-Host "  - $(Split-Path -Leaf $dir)"
    }
}

Write-Host ""
Write-Host "Files to delete:" -ForegroundColor Yellow
foreach ($file in $deleteFiles) {
    if (Test-Path $file) {
        Write-Host "  - $(Split-Path -Leaf $file)"
    }
}

Write-Host ""
if (-not $Force) {
    $confirm = Read-Host "Proceed with deletion? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "Cancelled."
        exit 1
    }
}

Write-Host ""
Write-Host "Deleting directories..." -ForegroundColor Magenta
$count = 0
foreach ($dir in $deleteDirs) {
    if (Test-Path $dir) {
        Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  OK: $(Split-Path -Leaf $dir)"
        $count++
    }
}

Write-Host ""
Write-Host "Deleting files..." -ForegroundColor Magenta
foreach ($file in $deleteFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force -ErrorAction SilentlyContinue
        Write-Host "  OK: $(Split-Path -Leaf $file)"
        $count++
    }
}

Write-Host ""
Write-Host "Complete! Freed $('{0:N1}' -f $totalSize) MB ($count items deleted)" -ForegroundColor Green
