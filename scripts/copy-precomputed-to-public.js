#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SRC = path.join(process.cwd(), 'dist', 'narrative', 'precomputed');
const DEST = path.join(process.cwd(), 'public', 'narrative', 'precomputed');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(src, e.name);
    const destPath = path.join(dest, e.name);
    if (e.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (e.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  return true;
}

try {
  const ok = copyRecursive(SRC, DEST);
  if (!ok) {
    console.warn('[copy-precomputed] No precomputed bundles found at', SRC);
    process.exit(0);
  }
  console.log('[copy-precomputed] Copied precomputed bundles to', DEST);
  process.exit(0);
} catch (e) {
  console.error('[copy-precomputed] Error copying precomputed bundles:', e && e.message ? e.message : String(e));
  process.exit(2);
}
