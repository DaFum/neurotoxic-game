import fs from 'fs';

const files = [
  'src/scenes/kabelsalat/hooks/useKabelsalatShuffle.ts',
  'src/scenes/kabelsalat/hooks/useKabelsalatTimer.ts',
  'src/scenes/kabelsalat/hooks/useKabelsalatInteractions.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /import \{([^}]+)\} from 'react'/,
    (match, p1) => {
      const parts = p1.split(',').map(p => p.trim());
      const newParts = parts.map(p => {
        if (p === 'MutableRefObject' || p === 'Dispatch' || p === 'SetStateAction') {
          return `type ${p}`;
        }
        return p;
      });
      return `import { ${newParts.join(', ')} } from 'react'`;
    }
  );
  fs.writeFileSync(file, content);
}
