const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('src/App.jsx', 'utf8');
const lines = code.split('\n');
for (let i = lines.length; i >= 0; i -= 1) {
  const prefix = lines.slice(0, i).join('\n');
  try {
    parser.parse(prefix, { sourceType: 'module', plugins: ['jsx'] });
    console.log('valid through line', i);
    console.log('last lines:\n' + prefix.split('\n').slice(Math.max(0, i - 20), i).join('\n'));
    process.exit(0);
  } catch (err) {
    // continue
  }
}
console.log('no valid prefix');
