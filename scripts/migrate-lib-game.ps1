#!/usr/bin/env pwsh
<#
.SYNOPSIS
Migration script for lib/game → core/ refactoring (PHASE 2)

.DESCRIPTION
Replaces all @/lib/game imports with their new locations in core/

.NOTES
Execute from project root: ./scripts/migrate-lib-game.ps1
#>

param(
    [switch]$DryRun = $false
)

$replacements = @(
    # Biome templates: lib/game/templates/* → core/data/biomes/*
    @{ Old = "@/lib/game/templates/forest"; New = "@/core/data/biomes/forest" },
    @{ Old = "@/lib/game/templates/grassland"; New = "@/core/data/biomes/grassland" },
    @{ Old = "@/lib/game/templates/desert"; New = "@/core/data/biomes/desert" },
    @{ Old = "@/lib/game/templates/swamp"; New = "@/core/data/biomes/swamp" },
    @{ Old = "@/lib/game/templates/mountain"; New = "@/core/data/biomes/mountain" },
    @{ Old = "@/lib/game/templates/cave"; New = "@/core/data/biomes/cave" },
    @{ Old = "@/lib/game/templates/jungle"; New = "@/core/data/biomes/jungle" },
    @{ Old = "@/lib/game/templates/volcanic"; New = "@/core/data/biomes/volcanic" },
    @{ Old = "@/lib/game/templates/wall"; New = "@/core/data/biomes/wall" },
    @{ Old = "@/lib/game/templates/floptropica"; New = "@/core/data/biomes/floptropica" },
    @{ Old = "@/lib/game/templates/beach"; New = "@/core/data/biomes/beach" },
    @{ Old = "@/lib/game/templates/city"; New = "@/core/data/biomes/city" },
    @{ Old = "@/lib/game/templates/corrupted"; New = "@/core/data/biomes/corrupted" },
    @{ Old = "@/lib/game/templates/floating"; New = "@/core/data/biomes/floating" },
    @{ Old = "@/lib/game/templates/mesa"; New = "@/core/data/biomes/mesa" },
    @{ Old = "@/lib/game/templates/mushroom"; New = "@/core/data/biomes/mushroom" },
    @{ Old = "@/lib/game/templates/ocean"; New = "@/core/data/biomes/ocean" },
    @{ Old = "@/lib/game/templates/space_station"; New = "@/core/data/biomes/space_station" },
    @{ Old = "@/lib/game/templates/tundra"; New = "@/core/data/biomes/tundra" },
    @{ Old = "@/lib/game/templates/underwater"; New = "@/core/data/biomes/underwater" },
    @{ Old = "@/lib/game/templates/weapons"; New = "@/core/data/biomes/weapons" },
    @{ Old = "@/lib/game/templates"; New = "@/core/data/biomes" },
    
    # Narrative data: lib/game/data → core/data/narrative
    @{ Old = "@/lib/game/data/narrative-templates"; New = "@/core/data/narrative/templates" },
    
    # Definitions: lib/game/definitions → core/domain
    @{ Old = "@/lib/game/definitions"; New = "@/core/domain" },
    
    # Engine logic: lib/game/engine → core/rules or core/usecases
    @{ Old = "@/lib/game/engine/effect-engine"; New = "@/core/rules/effects/effect-engine" },
    @{ Old = "@/lib/game/engine/crafting"; New = "@/core/engines/game/crafting" },
    @{ Old = "@/lib/game/engine/generation"; New = "@/core/engines/game/generation" },
    @{ Old = "@/lib/game/engine/offline"; New = "@/core/engines/game/offline" },
    
    # Utilities: lib/game/* → lib/utils or appropriate location
    @{ Old = "@/lib/game/item-utils"; New = "@/lib/utils/item-utils" },
    @{ Old = "@/lib/game/normalize"; New = "@/lib/utils/normalize" },
    @{ Old = "@/lib/game/time/time-utils"; New = "@/lib/utils/time-utils" },
    
    # Movement: stays in lib/game but might move to core/data
    @{ Old = "@/lib/game/movement-narrative"; New = "@/core/usecases/movement-narrative" },
    @{ Old = "@/lib/game/movement-templates"; New = "@/core/data/narrative/movement-templates" },
    
    # Type definitions: lib/game/types → core/domain
    @{ Old = "@/lib/game/types"; New = "@/core/domain" },
    
    # Config: stays in lib/game
    # @{ Old = "@/lib/game/config"; New = "@/lib/game/config" },
);

Write-Host "Preparing to migrate lib/game imports..." -ForegroundColor Cyan
Write-Host "Total replacements: $($replacements.Count)" -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "`n=== DRY RUN MODE ===" -ForegroundColor Yellow
}
else {
    Write-Host "`n=== LIVE MODE ===" -ForegroundColor Green
}

$filesModified = 0;
$totalReplacements = 0;

# Find all TypeScript/React files
$files = Get-ChildItem -Path "D:\dreamland-engine\src" -Recurse -Include "*.ts", "*.tsx" -File;

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw;
    $originalContent = $content;
    
    foreach ($replacement in $replacements) {
        $pattern = [regex]::Escape($replacement.Old);
        if ($content -match $pattern) {
            $replacementCount = ([regex]::Matches($content, $pattern)).Count;
            $content = $content -replace $pattern, $replacement.New;
            $totalReplacements += $replacementCount;
            
            Write-Host "$($file.Name): $replacement.Old → $replacement.New ($replacementCount)" -ForegroundColor Green;
        }
    }
    
    if ($content -ne $originalContent) {
        $filesModified++;
        if (-not $DryRun) {
            Set-Content $file.FullName $content -Encoding UTF8;
        }
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan;
Write-Host "Files modified: $filesModified" -ForegroundColor Yellow;
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Yellow;

if ($DryRun) {
    Write-Host "`nDRY RUN COMPLETE - No files were actually modified." -ForegroundColor Yellow;
}
else {
    Write-Host "`nMIGRATION COMPLETE" -ForegroundColor Green;
    Write-Host "Run 'npm run typecheck' to validate all imports." -ForegroundColor Cyan;
}
