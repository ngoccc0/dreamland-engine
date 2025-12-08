# Comprehensive audio cleanup script - removes ALL unused audio files
# Target: Reduce from 251MB to ~100MB by removing Jump footsteps, unused variants, and unused SFX

$basePath = "d:\dreamland-engine\public\asset\sound\sfx"

# Directories to delete entirely (unused biome variants + all Jump footsteps)
$dirsToDelete = @(
    "Footsteps_DirtyGround",      # Unused biome
    "Footsteps_Metal",            # Unused biome
    "Footsteps_Mud",              # Unused biome
    "Footsteps_Tile",             # Unused biome
    "Footsteps_Water",            # Unused biome
    "Footsteps_Wood",             # Unused biome
    "Items\Card and Board",       # Card/dice/chips - unused
    "Items\Machines",             # Drill/hydraulic/razor - unused
    "UI\sci_fi",                  # Sci-fi UI sounds - unused
    "steping_sounds\digital"      # Digital footsteps - unused
)

# Individual footstep files to delete (trim to 5 Walk per biome, remove all Jump)
$footstepFilesToDelete = @(
    # ===== Grass Jump (20 files) =====
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Land_01.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Land_02.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Land_03.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Land_04.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Land_05.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Land_06.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Land_07.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Land_08.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Land_09.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Land_10.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Start_01.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Start_02.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Start_03.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Start_04.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Start_05.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Start_06.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Start_07.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Start_08.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Start_09.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Jump\Footsteps_Grass_Jump_Start_10.wav",
    # Grass Walk - keep 01-05, delete 06-11 (6 files)
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Walk\Footsteps_Walk_Grass_Mono_06.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Walk\Footsteps_Walk_Grass_Mono_07.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Walk\Footsteps_Walk_Grass_Mono_08.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Walk\Footsteps_Walk_Grass_Mono_10.wav",
    "steping_sounds\Footsteps_Grass\Footsteps_Grass_Walk\Footsteps_Walk_Grass_Mono_11.wav",
    
    # ===== Gravel Jump (6 files) =====
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Jump\Footsteps_Jump_Land_01.wav",
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Jump\Footsteps_Jump_Land_02.wav",
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Jump\Footsteps_Jump_Land_03.wav",
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Jump\Footsteps_Jump_Start_01.wav",
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Jump\Footsteps_Jump_Start_02.wav",
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Jump\Footsteps_Jump_Start_03.wav",
    # Gravel Walk - keep 01-05, delete 06-10 (5 files)
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Walk\Footsteps_Gravel_Walk_06.wav",
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Walk\Footsteps_Gravel_Walk_07.wav",
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Walk\Footsteps_Gravel_Walk_08.wav",
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Walk\Footsteps_Gravel_Walk_09.wav",
    "steping_sounds\Footsteps_Gravel\Footsteps_Gravel_Walk\Footsteps_Gravel_Walk_10.wav",
    
    # ===== Leaves Jump (4 files) =====
    "steping_sounds\Footsteps_Leaves\Footsteps_Leaves_Jump\Footsteps_Leaves_Jump_Land_01.wav",
    "steping_sounds\Footsteps_Leaves\Footsteps_Leaves_Jump\Footsteps_Leaves_Jump_Land_02.wav",
    "steping_sounds\Footsteps_Leaves\Footsteps_Leaves_Jump\Footsteps_Leaves_Jump_Start_01.wav",
    "steping_sounds\Footsteps_Leaves\Footsteps_Leaves_Jump\Footsteps_Leaves_Jump_Start_02.wav",
    # Leaves Walk - keep 01-05, delete 06 (1 file)
    "steping_sounds\Footsteps_Leaves\Footsteps_Leaves_Walk\Footsteps_Leaves_Walk_06.wav",
    
    # ===== Rock Jump (12 files) =====
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Land_01.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Land_02.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Land_03.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Land_04.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Land_05.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Land_06.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Start_01.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Start_02.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Start_03.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Start_04.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Start_05.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Jump\Footsteps_Rock_Jump_Start_06.wav",
    # Rock Walk - keep 01-05, delete 06-09 (4 files)
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Walk\Footsteps_Rock_Walk_06.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Walk\Footsteps_Rock_Walk_07.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Walk\Footsteps_Rock_Walk_08.wav",
    "steping_sounds\Footsteps_Rock\Footsteps_Rock_Walk\Footsteps_Rock_Walk_09.wav",
    
    # ===== Sand Jump (10 files) =====
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Jump\Footsteps_Sand_Jump_Land_01.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Jump\Footsteps_Sand_Jump_Land_02.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Jump\Footsteps_Sand_Jump_Land_03.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Jump\Footsteps_Sand_Jump_Land_04.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Jump\Footsteps_Sand_Jump_Land_05.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Jump\Footsteps_Sand_Jump_Start_01.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Jump\Footsteps_Sand_Jump_Start_02.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Jump\Footsteps_Sand_Jump_Start_03.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Jump\Footsteps_Sand_Jump_Start_04.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Jump\Footsteps_Sand_Jump_Start_05.wav",
    # Sand Walk - keep 01-05, delete 06-20 (15 files)
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_06.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_07.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_08.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_09.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_10.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_11.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_12.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_13.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_14.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_15.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_16.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_17.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_18.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_19.wav",
    "steping_sounds\Footsteps_Sand\Footsteps_Sand_Walk\Footsteps_Sand_Walk_20.wav",
    
    # ===== Snow Jump (21 files - both Hard and normal variants) =====
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Hard_Jump_Land_01.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Hard_Jump_Land_02.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Hard_Jump_Land_03.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Hard_Jump_Land_04.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Hard_Jump_Land_05.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Hard_Jump_Start_01.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Hard_Jump_Start_02.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Hard_Jump_Start_03.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Hard_Jump_Start_04.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Hard_Jump_Start_05.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Land_01.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Land_02.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Land_03.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Land_04.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Land_05.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Land_06.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Start_01.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Start_02.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Start_03.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Start_04.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Start_05.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Jump\Footsteps_Snow_Jump_Start_06.wav",
    # Snow Walk - keep Hard 01-05 + normal 01-05, delete Hard 06-12 + normal 06-12 (14 files)
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Hard_Walk_06.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Hard_Walk_07.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Hard_Walk_08.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Hard_Walk_09.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Hard_Walk_10.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Hard_Walk_11.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Hard_Walk_12.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Walk_06.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Walk_07.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Walk_08.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Walk_09.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Walk_10.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Walk_11.wav",
    "steping_sounds\Footsteps_Snow\Footsteps_Snow_Walk\Footsteps_Snow_Walk_12.wav",
    
    # ===== Wood Jump (4 files) =====
    "steping_sounds\Footsteps_Wood\Footsteps_Wood_Jump\Footsteps_Wood_Jump_Land_01.wav",
    "steping_sounds\Footsteps_Wood\Footsteps_Wood_Jump\Footsteps_Wood_Jump_Land_02.wav",
    "steping_sounds\Footsteps_Wood\Footsteps_Wood_Jump\Footsteps_Wood_Jump_Start_01.wav",
    "steping_sounds\Footsteps_Wood\Footsteps_Wood_Jump\Footsteps_Wood_Jump_Start_02.wav",
    # Wood Walk - keep 01-05, delete 06-10 (5 files)
    "steping_sounds\Footsteps_Wood\Footsteps_Wood_Walk\Footsteps_Wood_Walk_06.wav",
    "steping_sounds\Footsteps_Wood\Footsteps_Wood_Walk\Footsteps_Wood_Walk_07.wav",
    "steping_sounds\Footsteps_Wood\Footsteps_Wood_Walk\Footsteps_Wood_Walk_08.wav",
    "steping_sounds\Footsteps_Wood\Footsteps_Wood_Walk\Footsteps_Wood_Walk_09.wav",
    "steping_sounds\Footsteps_Wood\Footsteps_Wood_Walk\Footsteps_Wood_Walk_10.wav"
)

# Other unused SFX files
$otherFilesToDelete = @(
    # Human sounds (16 files)
    "Human\belch_1.wav",
    "Human\belch_2.wav",
    "Human\belch_3.wav",
    "Human\cough_double.wav",
    "Human\cough_short.wav",
    "Human\man_0.wav",
    "Human\man_1.wav",
    "Human\man_10.wav",
    "Human\man_2.wav",
    "Human\man_3.wav",
    "Human\man_4.wav",
    "Human\man_5.wav",
    "Human\man_6.wav",
    "Human\man_7.wav",
    "Human\man_8.wav",
    "Human\man_9.wav",
    
    # Unused ambient/misc sounds
    "Combat\ambient_wind.wav",
    "Combat\clock_ticking.wav",
    "Combat\lock_lock.wav",
    "Combat\lock_quick.wav",
    "Combat\lock_unlock.wav",
    "Items\broom_sweep_1.wav",
    "Items\broom_sweep_2.wav",
    "Items\book_open.wav",
    "Items\pencil_eraser.wav",
    "Items\pencil_scribble.wav",
    "Items\shovel_dig.wav",
    "Items\tennis_ball_bounce_1.wav",
    "Items\tennis_ball_bounce_2.wav",
    "Items\Materials\ceramic_jar_close.wav",
    "Items\Materials\ceramic_jar_open.wav",
    "Items\Materials\clothing_thud.wav",
    "Items\Materials\concrete_scrape.wav",
    "Items\Materials\cork_stabbed.wav",
    "Items\Materials\glass_ping_big.wav",
    "Items\Materials\glass_ping_small.wav",
    "Items\Materials\paper_move.wav",
    "Items\Materials\paper_scrunch.wav",
    "Items\Materials\paper_sort.wav",
    "Items\Materials\paper_tear_1.wav",
    "Items\Materials\paper_tear_2.wav",
    "Items\Materials\stone_push_long.wav",
    "Items\Materials\stone_push_medium.wav",
    "Items\Materials\stone_push_short.wav",
    "Items\Materials\aluminium_can_place.wav",
    "Items\Materials\bamboo_drop.wav",
    "Items\Weapons\harsh_thud.wav",
    "Items\Weapons\shot_muffled.wav",
    "Items\Weapons\sword_clash_2.wav",
    "Items\Weapons\sword_drop.wav",
    "Items\Weapons\sword_light.wav",
    "Items\Weapons\sword_sharpen.wav",
    "Items\Weapons\sword_slice.wav",
    "Items\Weapons\sword_unsheath.wav",
    "Items\Weapons\weapon_pick_up.wav",
    "Items\Weapons\weapon_unequip.wav",
    "Items\Weapons\weapon_upgrade.wav",
    "UI\button_click.m4a",
    "UI\click_double_off_2.wav",
    "UI\click_double_on.wav"
)

Write-Host ""
Write-Host "======================================================"
Write-Host "COMPREHENSIVE AUDIO CLEANUP SCRIPT"
Write-Host "======================================================"
Write-Host ""
Write-Host "This script removes approximately 60+ MB of unused audio:"
Write-Host "- All Jump footstep variants (all biomes)"
Write-Host "- Trim Walk footsteps to 5 per biome"
Write-Host "- Delete unused biome footstep directories"
Write-Host "- Remove card/dice/chips/machines SFX"
Write-Host "- Remove sci-fi UI sounds"
Write-Host "- Remove digital footsteps"
Write-Host "- Remove human sounds"
Write-Host "- Remove other misc unused SFX"
Write-Host ""

# Calculate total space
$totalSizeBytes = 0

Write-Host "DIRECTORIES TO DELETE:"
foreach ($dir in $dirsToDelete) {
    $fullPath = Join-Path $basePath $dir
    if (Test-Path $fullPath) {
        $size = (Get-ChildItem -Path $fullPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $sizeMB = [math]::Round($size / 1MB, 1)
        Write-Host "  $dir ($sizeMB MB)"
        $totalSizeBytes += $size
    }
}

$footstepsDeleted = 0
foreach ($file in $footstepFilesToDelete) {
    $fullPath = Join-Path $basePath $file
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length
        $totalSizeBytes += $size
        $footstepsDeleted++
    }
}
Write-Host ""
Write-Host "FOOTSTEP FILES TO DELETE: $footstepsDeleted files"

$otherDeleted = 0
foreach ($file in $otherFilesToDelete) {
    $fullPath = Join-Path $basePath $file
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length
        $totalSizeBytes += $size
        $otherDeleted++
    }
}
Write-Host "OTHER SFX FILES TO DELETE: $otherDeleted files"

$totalMB = [math]::Round($totalSizeBytes / 1MB, 1)
Write-Host ""
Write-Host "TOTAL SPACE TO FREE: $totalMB MB"
Write-Host ""

$confirm = Read-Host "Proceed with deletion? (y/n):"

if ($confirm -eq "y" -or $confirm -eq "Y") {
    Write-Host ""
    Write-Host "Deleting directories..."
    $deletedDirs = 0
    foreach ($dir in $dirsToDelete) {
        $fullPath = Join-Path $basePath $dir
        if (Test-Path $fullPath) {
            Remove-Item -Path $fullPath -Recurse -Force -ErrorAction SilentlyContinue
            $deletedDirs++
        }
    }
    Write-Host "  [OK] Deleted $deletedDirs directories"

    Write-Host ""
    Write-Host "Deleting footstep files..."
    $deletedFiles = 0
    foreach ($file in $footstepFilesToDelete) {
        $fullPath = Join-Path $basePath $file
        if (Test-Path $fullPath) {
            Remove-Item -Path $fullPath -Force -ErrorAction SilentlyContinue
            $deletedFiles++
        }
    }
    Write-Host "  [OK] Deleted $deletedFiles footstep files"

    Write-Host ""
    Write-Host "Deleting other SFX files..."
    $deletedOther = 0
    foreach ($file in $otherFilesToDelete) {
        $fullPath = Join-Path $basePath $file
        if (Test-Path $fullPath) {
            Remove-Item -Path $fullPath -Force -ErrorAction SilentlyContinue
            $deletedOther++
        }
    }
    Write-Host "  [OK] Deleted $deletedOther other SFX files"

    Write-Host ""
    Write-Host "======================================================"
    Write-Host "CLEANUP COMPLETE!"
    Write-Host "Freed approximately $totalMB MB"
    Write-Host "Total deleted: $($deletedDirs + $deletedFiles + $deletedOther) items"
    Write-Host "======================================================"
} else {
    Write-Host "Cleanup cancelled."
}
