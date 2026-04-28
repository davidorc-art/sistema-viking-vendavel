const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const lines = content.split('\n');
// We want to remove from "  app.get('/api/debug/infinitepay'" to "  // Calendar Feed Route"
const startIndex = lines.findIndex(l => l.includes("app.get('/api/debug/infinitepay'"));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes("// Calendar Feed Route"));
if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex);
  fs.writeFileSync('server.ts', lines.join('\n'), 'utf8');
  console.log('Removed successfully!');
} else {
  console.log('Not found:', startIndex, endIndex);
}
