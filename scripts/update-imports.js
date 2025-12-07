const fs = require('fs');
const path = require('path');

function updateImports(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      updateImports(filePath);
    } else if (file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      // Replace imports
      content = content.replace(/@\/lib\/game\/types/g, '@/core/types/game');

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  }
}

updateImports('./src');
console.log('Import updates completed.');
