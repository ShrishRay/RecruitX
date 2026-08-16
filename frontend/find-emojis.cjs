const fs = require('fs');
const path = require('path');

const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

function scanDir(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanDir(p));
    } else if (entry.isFile() && (p.endsWith('.jsx') || p.endsWith('.js') || p.endsWith('.html'))) {
      const text = fs.readFileSync(p, 'utf8');
      const lines = text.split('\n');
      const emojiLines = [];
      lines.forEach((l, i) => {
        if (emojiRegex.test(l)) {
          emojiLines.push({ line: i + 1, content: l.trim() });
        }
      });
      if (emojiLines.length > 0) {
        results.push({ file: p, lines: emojiLines });
      }
    }
  }
  return results;
}

const found = scanDir('./src');
console.log(`Found ${found.length} files containing emojis:`);
for (const item of found) {
  console.log(`\n=== ${item.file} (${item.lines.length} occurrences) ===`);
  item.lines.forEach(l => console.log(`  [${l.line}] ${l.content}`));
}
