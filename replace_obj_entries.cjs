const fs = require('fs');
const content = fs.readFileSync('src/context/reducers/bandReducer.ts', 'utf-8');

const updated = content.replace(
  /for \(const \[itemId, qty\] of Object\.entries\(recipe\.inputs\)\) \{/g,
  `for (const itemId in recipe.inputs) {\n    if (!Object.hasOwn(recipe.inputs, itemId)) continue\n    const qty = recipe.inputs[itemId] as number`
);

fs.writeFileSync('src/context/reducers/bandReducer.ts', updated);
console.log('Done bandReducer');

const content2 = fs.readFileSync('src/context/reducers/systemReducer.ts', 'utf-8');

const updated2 = content2.replace(
  /for \(const \[key, value\] of Object\.entries\(safeState\.reputationByRegion\)\) \{/g,
  `for (const key in safeState.reputationByRegion) {\n        if (!Object.hasOwn(safeState.reputationByRegion, key)) continue\n        const value = safeState.reputationByRegion[key] as number`
);

fs.writeFileSync('src/context/reducers/systemReducer.ts', updated2);
console.log('Done systemReducer');

const content3 = fs.readFileSync('src/utils/gigInputUtils.ts', 'utf-8');

const updated3 = content3.replace(
  /for \(const \[index, lane\] of Object\.entries\(lanesRecord\)\) \{/g,
  `for (const index in lanesRecord) {\n      if (!Object.hasOwn(lanesRecord, index)) continue\n      const lane = lanesRecord[index]`
);

fs.writeFileSync('src/utils/gigInputUtils.ts', updated3);
console.log('Done gigInputUtils');

const content4 = fs.readFileSync('src/data/songs.ts', 'utf-8');

const updated4 = content4.replace(
  /return Object\.entries\(rawSongs\)\.map\(\(\[key, song\]\) => \{/g,
  `return (() => {\n    const nodes = []\n    for (const key in rawSongs) {\n      if (!Object.hasOwn(rawSongs, key)) continue\n      const song = rawSongs[key] as RawSong`
).replace(
  /            \? Math\.max\(0, durationMsValue\)\n            : null\n    \}\n  \}\)/g,
  `            ? Math.max(0, durationMsValue)\n            : null\n    }\n    nodes.push(node)\n    }\n    return nodes\n  })()`
).replace(
  /    return \{\n      id: key,/g,
  `    const node: Song = {\n      id: key,`
);

fs.writeFileSync('src/data/songs.ts', updated4);
console.log('Done songs');

const content5 = fs.readFileSync('src/ui/bandhq/detailedStats/components/CraftingSection.tsx', 'utf-8');

const updated5 = content5.replace(
  /Object\.entries\(recipe\.inputs\)\.every\(\s*\(\[itemId, qty\]\) => getStashStacks\(stash, itemId\) >= qty\s*\)/g,
  `(() => {\n            for (const itemId in recipe.inputs) {\n              if (!Object.hasOwn(recipe.inputs, itemId)) continue\n              const qty = (recipe.inputs as Record<string, number>)[itemId]\n              if (qty !== undefined && getStashStacks(stash, itemId) < qty) return false\n            }\n            return true\n          })()`
);

fs.writeFileSync('src/ui/bandhq/detailedStats/components/CraftingSection.tsx', updated5);
console.log('Done CraftingSection');

const content6 = fs.readFileSync('src/ui/bandhq/detailedStats/components/InventoryEquipmentSection.tsx', 'utf-8');

const updated6 = content6.replace(
  /\{Object\.entries\(band\.inventory \?\? \{\}\)\.map\(\(\[key, val\]\) => \{/g,
  `{(() => {\n        const result = []\n        const inv = band.inventory ?? {}\n        for (const key in inv) {\n          if (!Object.hasOwn(inv, key)) continue\n          const val = inv[key]`
).replace(
  /locked=\{\!isUnlocked\(val\)\}\n          \/>\n        \)\n      \}\)\}/g,
  `locked={!isUnlocked(val)}\n          />\n        )\n        result.push(node)\n        }\n        return result\n      })()}`
).replace(
  /return \(\n          <DetailRow/g,
  `const node = (\n          <DetailRow`
);

fs.writeFileSync('src/ui/bandhq/detailedStats/components/InventoryEquipmentSection.tsx', updated6);
console.log('Done InventoryEquipmentSection');


const content7 = fs.readFileSync('src/ui/bandhq/detailedStats/components/MemberEquipment.tsx', 'utf-8');

const updated7 = content7.replace(
  /return Object\.entries\(member\.equipment\)\.map\(\(\[k, v\]\) => \(/g,
  `return (() => {\n    const nodes = []\n    for (const k in member.equipment) {\n      if (!Object.hasOwn(member.equipment, k)) continue\n      const v = member.equipment[k]\n      nodes.push(\n    `
).replace(
  /      <\/span>\n    <\/div>\n  \)\)/g,
  `      </span>\n    </div>\n      )\n    }\n    return nodes\n  })()`
);

fs.writeFileSync('src/ui/bandhq/detailedStats/components/MemberEquipment.tsx', updated7);
console.log('Done MemberEquipment');

const content8 = fs.readFileSync('src/ui/bandhq/detailedStats/components/RegionalStandingSection.tsx', 'utf-8');

const updated8 = content8.replace(
  /Object\.entries\(reputationByRegion\)\.map\(\(\[region, rep\]\) => \(/g,
  `(() => {\n      const nodes = []\n      for (const region in reputationByRegion) {\n        if (!Object.hasOwn(reputationByRegion, region)) continue\n        const rep = reputationByRegion[region]\n        nodes.push(\n        `
).replace(
  /        \}\n      \/>\n    \)\)/g,
  `        }\n      />\n      )\n      }\n      return nodes\n    })()`
);

fs.writeFileSync('src/ui/bandhq/detailedStats/components/RegionalStandingSection.tsx', updated8);
console.log('Done RegionalStandingSection');

const content9 = fs.readFileSync('src/ui/settings/LogSettings.tsx', 'utf-8');

const updated9 = content9.replace(
  /\{Object\.entries\(LOG_LEVELS\)\.map\(\(\[key, value\]\) => \(/g,
  `{(() => {\n            const nodes = []\n            for (const key in LOG_LEVELS) {\n              if (!Object.hasOwn(LOG_LEVELS, key)) continue\n              const value = LOG_LEVELS[key as keyof typeof LOG_LEVELS]\n              nodes.push(\n            `
).replace(
  /            <\/option>\n          \)\)\}/g,
  `            </option>\n            )\n            }\n            return nodes\n          })()}`
);

fs.writeFileSync('src/ui/settings/LogSettings.tsx', updated9);
console.log('Done LogSettings');
