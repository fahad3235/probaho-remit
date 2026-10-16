const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === 'extracted_fixed_13') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJsFiles(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const jsFiles = getJsFiles('.');
console.log('Total JS files to check:', jsFiles.length);

let errors = 0;
jsFiles.forEach(f => {
  try {
    execSync(`node -c "${f}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error('SYNTAX ERROR in:', f);
    errors++;
  }
});

if (errors === 0) {
  console.log('SUCCESS: All', jsFiles.length, 'JS files passed syntax check cleanly!');
} else {
  console.error('FAILED: Found', errors, 'files with syntax errors!');
  process.exit(1);
}
