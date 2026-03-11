import fs from 'fs';
const enPath = 'public/locales/en/ui.json';
const dePath = 'public/locales/de/ui.json';

const enUi = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const deUi = JSON.parse(fs.readFileSync(dePath, 'utf8'));

if (!enUi.inventory) enUi.inventory = {};
enUi.inventory.slot = "Inventory slot: {{name}}";
enUi.inventory.emptySlot = "Empty inventory slot: {{label}}";

if (!deUi.inventory) deUi.inventory = {};
deUi.inventory.slot = "Inventarplatz: {{name}}";
deUi.inventory.emptySlot = "Leerer Inventarplatz: {{label}}";

fs.writeFileSync(enPath, JSON.stringify(enUi, null, 2) + "\n");
fs.writeFileSync(dePath, JSON.stringify(deUi, null, 2) + "\n");
