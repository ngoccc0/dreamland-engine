const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/lib/game/data/narrative-templates.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Find all {{placeholders}} in templates
const placeholderRegex = /{{\s*([^}]+?)\s*}}/g;
let m;
const placeholders = new Set();
while ((m = placeholderRegex.exec(content)) !== null) {
  placeholders.add(m[1].trim());
}

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
const missing = [];
for (const ph of placeholders) {
  // ignore common dynamic placeholders handled elsewhere (e.g., light_level_detail, temp_detail, moisture_detail)
  if (ph.startsWith('light_level') || ph.startsWith('temp_') || ph.startsWith('moisture_') || ph.includes('player_') || ph.includes('enemy') || ph.includes('item')) continue;
  if (!presentKeys.has(ph)) missing.push(ph);
}

console.log('Total placeholders found:', placeholders.size);
console.log('Total present keys (heuristic):', presentKeys.size);
if (missing.length === 0) {
  console.log('No missing placeholders detected by heuristic.');
} else {
  console.log('Missing placeholders (heuristic):');
  missing.forEach(k => console.log(' -', k));
}
