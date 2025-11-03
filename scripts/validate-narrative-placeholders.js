const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/lib/game/data/narrative-templates.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Find all {{placeholders}} in templates and record their line numbers
const placeholderRegex = /{{\s*([^}]+?)\s*}}/g;
const placeholders = new Map(); // placeholder -> [{line, col}, ...]
content.split('\n').forEach((lineText, idx) => {
  let match;
  while ((match = placeholderRegex.exec(lineText)) !== null) {
    const ph = match[1].trim();
    const list = placeholders.get(ph) || [];
    list.push({ line: idx + 1, col: match.index + 1 });
    placeholders.set(ph, list);
  }
});

// Collect keys that exist in adjectives/features/smells/sounds/sky sections per biome
// We'll do a rough heuristic: gather all keys that are object property names in the file
const propertyRegex = /(?:adjectives|features|smells|sounds|sky)\s*:\s*\{([\s\S]*?)\}\s*,/g;
let propMatch;
const presentKeys = new Set();
while ((propMatch = propertyRegex.exec(content)) !== null) {
  const block = propMatch[1];
  // find property names inside block
  const keyRegex = /["']?([a-zA-Z0-9_\-]+)["']?\s*:\s*(?:\[|\{)/g;
  let km;
  while ((km = keyRegex.exec(block)) !== null) {
    presentKeys.add(km[1]);
  }
}

// Also collect top-level adjectives keys like "adjectives: { "jungle_terrain_desc": [...] }"
const topLevelKeyRegex = /(["']?)([a-zA-Z0-9_\-]+)\1\s*:\s*\[/g; // crude
let tkm;
while ((tkm = topLevelKeyRegex.exec(content)) !== null) {
  presentKeys.add(tkm[2]);
}

// Now check which placeholders are missing
// Helper: simple levenshtein distance for fuzzy suggestions
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

const missing = [];
for (const [ph, locs] of placeholders) {
  // ignore known dynamic placeholders handled elsewhere
  if (ph.startsWith('light_level') || ph.startsWith('temp_') || ph.startsWith('moisture_') || ph.includes('player_') || ph.includes('enemy') || ph.includes('item') || ph.includes('sensory')) continue;
  if (!presentKeys.has(ph)) {
    // compute suggestions
    const suggestions = Array.from(presentKeys)
      .map(k => ({ key: k, dist: levenshtein(ph, k) }))
      .sort((a,b) => a.dist - b.dist)
      .slice(0,3)
      .map(x => x.key);
    missing.push({ placeholder: ph, locations: locs, suggestions });
  }
}

console.log('Total distinct placeholders found:', placeholders.size);
console.log('Total present keys (heuristic):', presentKeys.size);
if (missing.length === 0) {
  console.log('No missing placeholders detected by heuristic.');
  process.exitCode = 0;
} else {
  console.log('\nMissing placeholders (heuristic):');
  missing.forEach(m => {
    console.log(`\n - ${m.placeholder}`);
    m.locations.forEach(loc => console.log(`    at ${filePath}:${loc.line}:${loc.col}`));
    if (m.suggestions && m.suggestions.length > 0) console.log(`    suggestions: ${m.suggestions.join(', ')}`);
  });
  console.log('\nHint: run this script as part of CI to catch broken templates.');
  process.exitCode = 1;
}
