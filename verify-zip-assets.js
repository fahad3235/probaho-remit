const fs = require('fs');

function inspectZip(filename) {
  const buf = fs.readFileSync(filename);
  let offset = 0;
  const entries = new Set();
  while (offset < buf.length - 4) {
    if (buf.readUInt32LE(offset) === 0x04034b50) {
      const nameLen = buf.readUInt16LE(offset + 26);
      const extraLen = buf.readUInt16LE(offset + 28);
      const name = buf.toString('utf8', offset + 30, offset + 30 + nameLen);
      entries.add(name);
      offset += 30 + nameLen + extraLen;
    } else {
      offset++;
    }
  }
  return entries;
}

const entries = inspectZip('probaho-remit-netlify.zip');
const html = fs.readFileSync('index.html', 'utf8');

const linkRegex = /<link[^>]+href=["']([^"']+)["']/g;
const scriptRegex = /<script[^>]+src=["']([^"']+)["']/g;

let m;
const missing = [];
while ((m = linkRegex.exec(html)) !== null) {
  const href = m[1];
  if (!href.startsWith('http') && !entries.has(href)) {
    missing.push('LINK: ' + href);
  }
}

while ((m = scriptRegex.exec(html)) !== null) {
  const src = m[1];
  if (!src.startsWith('http') && !entries.has(src)) {
    missing.push('SCRIPT: ' + src);
  }
}

console.log('Zip total files:', entries.size);
console.log('Missing assets in zip:', missing);
console.log('All linked assets verified in zip:', missing.length === 0);
