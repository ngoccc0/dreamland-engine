const fs = require('fs').promises;
const path = require('path');

async function copyDir(src, dest) {
  try {
    const entries = await fs.readdir(src, { withFileTypes: true });
    await fs.mkdir(dest, { recursive: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else if (entry.isFile()) {
        await fs.copyFile(srcPath, destPath);
        console.log('Copied', srcPath, '->', destPath);
      }
    }
  } catch (err) {
    console.error('Error copying', src, '->', dest, err);
    process.exitCode = 2;
  }
}

async function main() {
  const repoRoot = process.cwd();
  const src = path.join(repoRoot, 'asset', 'sound');
  const dest = path.join(repoRoot, 'public', 'asset', 'sound');
  try {
    await copyDir(src, dest);
    console.log('Copy finished.');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}

main();
