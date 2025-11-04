#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

(async function main(){
  const args = process.argv.slice(2);
  const file = args[0] || path.resolve(process.cwd(), 'dist/narrative/precomputed/forest/en/bundle.json');
  if (!fs.existsSync(file)) {
    console.error('Bundle not found:', file);
    process.exit(2);
  }
  try {
    const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
    // dynamic import of the TS module that exports Zod schemas
    const modPath = path.resolve(process.cwd(), 'src/lib/narrative/schemas.ts');
    // Use ts-node/register if available, otherwise import compiled JS if present
    let schemas;
    try {
      // prefer runtime import via ts-node if present in environment
      require('ts-node/register');
      schemas = require(modPath);
    } catch (e) {
      // fallback to compiled JS path
      const jsPath = modPath.replace(/\.ts$/, '.js');
      schemas = require(jsPath);
    }

    if (!schemas || !schemas.validateBundle) {
      console.error('Cannot find validateBundle in schemas module.');
      process.exit(3);
    }

    const valid = schemas.validateBundle(obj);
    console.log('Bundle valid:', file);
    console.log('Version:', valid.version, 'biome:', valid.biome, 'locale:', valid.locale, 'variants:', valid.variants.length);
    process.exit(0);
  } catch (err) {
    console.error('Validation failed:', err && err.message ? err.message : err);
    if (err && err.errors) console.error(err.errors);
    process.exit(1);
  }
})();
