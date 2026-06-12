const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /bg-gradient-to-br/g, replace: 'bg-linear-to-br' },
  { search: /bg-gradient-to-r/g, replace: 'bg-linear-to-r' },
  { search: /font-\[family-name:var\(--font-outfit\)]/g, replace: 'font-(family-name:--font-outfit)' },
  { search: /font-\[family-name:var\(--font-inter\)]/g, replace: 'font-(family-name:--font-inter)' },
  { search: /flex-shrink-0/g, replace: 'shrink-0' },
  { search: /hover:bg-white\/\[0\.03\]/g, replace: 'hover:bg-white/3' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { search, replace } of replacements) {
        if (search.test(content)) {
          content = content.replace(search, replace);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src', 'app'));
