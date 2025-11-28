/**
 * Script to capture console logs during player move animation
 * Run in browser DevTools console to see animation rerender behavior
 */

// Capture all console.debug calls
const logs = [];
const originalDebug = console.debug;
console.debug = function (...args) {
    const msg = args.join(' ');
    if (msg.includes('[MINIMAP') || msg.includes('[GAME-LAYOUT')) {
        logs.push(msg);
    }
    originalDebug.apply(console, args);
};

// Simulate a player move (press arrow key)
const simulateMove = () => {
    logs.length = 0;
    console.log('=== STARTING MOVE ANIMATION TEST ===');

    // Simulate pressing right arrow key
    const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        code: 'ArrowRight',
        keyCode: 39,
        which: 39,
        bubbles: true
    });
    document.dispatchEvent(event);

    // Wait for animation to complete (600ms)
    setTimeout(() => {
        console.log('=== ANIMATION COMPLETE ===');
        console.log(`Total minimap-related logs: ${logs.length}`);
        console.log('=== LOGS ===');
        logs.forEach((log, i) => console.log(`${i + 1}. ${log}`));
    }, 700);
};

console.log('Test script loaded. Call simulateMove() to test.');
