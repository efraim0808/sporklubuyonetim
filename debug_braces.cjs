const fs = require('fs');
const code = fs.readFileSync('src/App.jsx', 'utf8');
const stack = [];
let quote = null;
let escape = false;
let inComment = null;
let templateDepth = 0;
let templateBraceDepth = 0;

for (let i = 0; i < code.length; i += 1) {
  const ch = code[i];
  const next = code[i + 1];

  if (quote) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === quote) {
      quote = null;
    }
    continue;
  }

  if (inComment) {
    if (inComment === '//' && ch === '\n') inComment = null;
    if (inComment === '/*' && ch === '*' && next === '/') {
      inComment = null;
      i += 1;
    }
    continue;
  }

  if (templateDepth > 0) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '`') {
      templateDepth -= 1;
      if (templateDepth === 0) {
        templateBraceDepth = 0;
      }
      continue;
    }
    if (ch === '$' && next === '{') {
      templateBraceDepth += 1;
      i += 1;
      continue;
    }
    if (templateBraceDepth > 0) {
      if (ch === '{') templateBraceDepth += 1;
      if (ch === '}') templateBraceDepth -= 1;
      continue;
    }
    continue;
  }

  if (ch === '/' && next === '/') { inComment = '//'; i += 1; continue; }
  if (ch === '/' && next === '*') { inComment = '/*'; i += 1; continue; }
  if (ch === '\'' || ch === '"') { quote = ch; continue; }
  if (ch === '`') { templateDepth = 1; continue; }

  if (ch === '{' || ch === '(' || ch === '[') {
    stack.push({ ch, i });
    continue;
  }

  if (ch === '}' || ch === ')' || ch === ']') {
    const last = stack.pop();
    const map = { '{': '}', '(': ')', '[': ']' };
    if (!last) {
      console.log('extra closing', ch, 'at', i);
      process.exit(1);
    }
    if (map[last.ch] !== ch) {
      console.log('mismatch at', last.i, last.ch, 'expected', map[last.ch], 'got', ch, 'at', i);
      process.exit(1);
    }
  }
}

console.log('remaining braces count', stack.length);
console.log(stack.slice(-20));
