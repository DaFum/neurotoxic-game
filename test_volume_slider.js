import fs from 'fs';
const content = fs.readFileSync('src/ui/shared/VolumeSlider.jsx', 'utf8');
console.log(content.includes('sr-only peer'));
