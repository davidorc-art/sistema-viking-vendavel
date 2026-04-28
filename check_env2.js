import fs from 'fs';
console.log(fs.readFileSync('.env', 'utf8').split('\n').map(l => l.split('=')[0]));
