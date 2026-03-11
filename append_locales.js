import fs from 'fs';

function addKeys(path, newKeys) {
  let content = fs.readFileSync(path, 'utf8');
  const obj = JSON.parse(content);
  Object.assign(obj, newKeys);
  // Sort keys alphabetically to match standard
  const sorted = {};
  Object.keys(obj).sort().forEach(k => {
    sorted[k] = obj[k];
  });
  fs.writeFileSync(path, JSON.stringify(sorted, null, 2) + "\n");
}

const enNew = {
  "inventory.slot": "Inventory slot: {{name}}",
  "inventory.emptySlot": "Empty inventory slot: {{label}}"
};

const deNew = {
  "inventory.slot": "Inventarplatz: {{name}}",
  "inventory.emptySlot": "Leerer Inventarplatz: {{label}}"
};

addKeys('public/locales/en/ui.json', enNew);
addKeys('public/locales/de/ui.json', deNew);
