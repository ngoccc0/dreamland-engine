#!/usr/bin/env node
/**
 * Precompute narrative bundles per-biome and per-locale.
 *
 * Usage: node scripts/precompute-narrative.js [--variants N] [--out ./dist/narrative/precomputed] [--locales en,vi]
 *
 * This is intentionally conservative: it uses a small local RNG and simple filler logic
 * to produce rendered variants for each template pattern and writes a bundle.json.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function hashStringTo32(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seed) {
  const seedNum = typeof seed === 'number' ? seed >>> 0 : hashStringTo32(String(seed || Date.now().toString()));
  const floatFn = mulberry32(seedNum);
  return {
    float: () => floatFn(),
    choice: (arr) => (arr && arr.length ? arr[Math.floor(floatFn() * arr.length)] : undefined),
    int: (min, max) => Math.floor(floatFn() * (max - min + 1)) + min,
    seedHex: '0x' + seedNum.toString(16).padStart(8, '0'),
  };
}

function readJsonIfExists(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('Failed to read JSON', p, e.message);
    return null;
  }
}

function writeOutput(outPath, obj) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(obj, null, 0), 'utf8');
}

function gzipSizeBytes(buf) {
  return zlib.gzipSync(Buffer.from(buf)).length;
}

const argv = require('minimist')(process.argv.slice(2));
const variantsArg = Number(argv.variants || argv.v || 5);
const OUT_DIR = argv.out || argv.o || path.join('dist', 'narrative', 'precomputed');
const LOCALES = (argv.locales || 'en,vi').split(',').map((s) => s.trim()).filter(Boolean);
const TARGET_BYTES = Number(argv.targetBytes || argv.t || 200 * 1024);

console.log(`[precompute] variants=${variantsArg} targetBytes=${TARGET_BYTES} out=${OUT_DIR} locales=${LOCALES.join(',')}`);

const templatesDir = path.join('src', 'lib', 'narrative', 'data');
let templateFiles = [];
try {
  templateFiles = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.json') && !f.endsWith('.lexicon.json'));
} catch (e) {
  console.warn('[precompute] templates dir not found, falling back to sample');
}

if (templateFiles.length === 0) {
  const sample = path.join(templatesDir, 'templates.sample.json');
  if (fs.existsSync(sample)) templateFiles = ['templates.sample.json'];
}

const templates = [];
for (const f of templateFiles) {
  const p = path.join(templatesDir, f);
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (Array.isArray(j)) templates.push(...j);
    else console.warn('[precompute] template file not array:', p);
  } catch (e) {
    console.warn('[precompute] failed to parse', p, e.message);
  }
}

if (templates.length === 0) {
  console.error('[precompute] no templates found - abort');
  process.exit(1);
}

for (const locale of LOCALES) {
  const lexiconPath = path.join(templatesDir, `lexicon.${locale}.json`);
  const lexicon = readJsonIfExists(lexiconPath) || {};

  // group templates by biome
  const byBiome = {};
  for (const t of templates) {
    const biome = (t.terrain || t.biome || 'default').toString();
    byBiome[biome] = byBiome[biome] || [];
    byBiome[biome].push(t);
  }

  for (const biome of Object.keys(byBiome)) {
    let N = variantsArg;
    let bundle = null;
    while (N >= 1) {
      bundle = {
        version: 1,
        biome,
        locale,
        generatedAt: new Date().toISOString(),
        templates: [],
      };

      for (const t of byBiome[biome]) {
        const tmpl = { id: t.id, weight: t.weight || 1, patterns: t.patterns || [], variants: [] };
        for (let i = 0; i < N; i++) {
          const seedStr = `${t.id}::${locale}::v${i}`;
          const rng = createRng(seedStr);
          const pattern = rng.choice(t.patterns || []);
          if (!pattern) continue;
          let text = pattern.template || '';
          const picks = [];
          const slots = pattern.slots || [];
          for (const slot of slots) {
            const pool = (lexicon && lexicon[slot]) || [];
            // filter by biome if present
            const filtered = pool.filter((e) => !e.biomes || e.biomes.length === 0 || e.biomes.includes(biome));
            const pick = filtered.length ? filtered[Math.floor(rng.float() * filtered.length)] : undefined;
            const pickText = pick ? pick.text : `{{${slot}}}`;
            picks.push(pick ? pick.id || pickText : null);
            // simple iterative replace for this slot
            const re = new RegExp(`{{\\s*${slot}\\s*}}`, 'g');
            text = text.replace(re, pickText);
          }

          // handle nested placeholders by one additional pass: replace any {{x}} using lexicon if found
          text = text.replace(/{{\\s*([a-zA-Z0-9_\\.]+)\\s*}}/g, (m, name) => {
            const pool2 = (lexicon && lexicon[name]) || [];
            if (pool2.length) return pool2[Math.floor(rng.float() * pool2.length)].text;
            return m;
          });

          tmpl.variants.push({ patternId: pattern.id || null, seed: seedStr, text, picks });
        }
        bundle.templates.push(tmpl);
      }

      const outPath = path.join(OUT_DIR, biome.toLowerCase(), locale, 'bundle.json');
      const json = JSON.stringify(bundle);
      const gz = gzipSizeBytes(json);
      console.log(`[precompute] biome=${biome} locale=${locale} N=${N} gz=${(gz/1024).toFixed(1)} KB`);
      if (gz <= TARGET_BYTES) {
        writeOutput(outPath, bundle);
        console.log('[precompute] wrote', outPath);
        break;
      }
      // else reduce N
      N = Math.max(1, Math.floor(N * 0.7));
      console.log('[precompute] bundle too large, reducing variants to', N);
      if (N === 1) {
        writeOutput(outPath, bundle);
        console.warn('[precompute] final bundle written but exceeded target size');
        break;
      }
    }
  }
}

console.log('[precompute] done');
