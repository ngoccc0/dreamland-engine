/**
 * Debug script to verify minimap layout after fixes
 * Run this in the browser console while the app is loaded
 */
function debugMinimap() {
    const viewport = document.querySelector('.minimap-viewport');
    const canvas = document.querySelector('.minimap-canvas');
    const maplayer = document.querySelector('.minimap-maplayer');

    if (!viewport) {
        console.error('❌ Minimap viewport not found');
        return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const canvasRect = canvas ? canvas.getBoundingClientRect() : null;
    const maplayerRect = maplayer ? maplayer.getBoundingClientRect() : null;

    console.log('=== MINIMAP DEBUG ===');
    console.log('');

    console.log('Viewport (should be SQUARE):');
    console.log(`  Width: ${viewportRect.width}px`);
    console.log(`  Height: ${viewportRect.height}px`);
    console.log(`  Aspect: ${(viewportRect.width / viewportRect.height).toFixed(2)}:1`);
    const isSquare = Math.abs(viewportRect.width - viewportRect.height) < 2;
    console.log(`  ✓ IS SQUARE: ${isSquare ? '✅ YES' : '❌ NO'}`);
    console.log('');

    if (canvasRect) {
        console.log('Canvas (terrain background):');
        console.log(`  Width: ${canvasRect.width}px`);
        console.log(`  Height: ${canvasRect.height}px`);
        console.log(`  Matches viewport: ${Math.abs(canvasRect.width - viewportRect.width) < 2 && Math.abs(canvasRect.height - viewportRect.height) < 2 ? '✅ YES' : '⚠️  OFFSET'}`);
    }

    if (maplayerRect) {
        console.log('Maplayer (DOM cells, with transforms):');
        console.log(`  Visual Width: ${maplayerRect.width}px`);
        console.log(`  Visual Height: ${maplayerRect.height}px`);
        const overflow = maplayerRect.width > viewportRect.width || maplayerRect.height > viewportRect.height;
        console.log(`  Overflow visible: ${overflow ? '⚠️  YES (should be clipped)' : '✅ NO (contained)'}`);
    }

    console.log('');
    console.log('CSS Variables:');
    const style = getComputedStyle(document.documentElement);
    const tileSize = style.getPropertyValue('--minimap-tile-size');
    const aspectRatio = style.getPropertyValue('aspect-ratio');
    console.log(`  --minimap-tile-size: ${tileSize}`);
    console.log(`  aspect-ratio on viewport: ${aspectRatio || '(not found, falling back to inline height)'}`);

    console.log('');
    const viewportStyle = window.getComputedStyle(viewport);
    console.log('Viewport Computed Styles:');
    console.log(`  overflow: ${viewportStyle.overflow}`);
    console.log(`  aspect-ratio: ${viewportStyle.aspectRatio}`);

    if (maplayer) {
        const maplayerStyle = window.getComputedStyle(maplayer);
        console.log('');
        console.log('Maplayer Computed Styles:');
        console.log(`  overflow: ${maplayerStyle.overflow}`);
        console.log(`  width: ${maplayerStyle.width}`);
        console.log(`  height: ${maplayerStyle.height}`);
    }

    console.log('');
    console.log('=== END DEBUG ===');
}

// Run automatically
debugMinimap();
