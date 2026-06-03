const fs = require('fs');
const text = fs.readFileSync('test_all.log', 'utf8');
const lines = text.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('not ok ')) {
        console.log(`Line ${i}: ${lines[i]}`);
    }
}
