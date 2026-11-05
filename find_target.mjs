import fs from 'fs';
import path from 'path';

const blacklist = [
  'src/hooks/travel/actions/useGetLocationName.ts',
  'src/components/stage/stageRenderUtils.ts',
  'src/hooks/travel/actions/useHandleTravel.ts',
  'src/components/assets/CrowdfundSetupModal.tsx',
  'src/utils/travelSoftlockUtils.ts',
  'src/utils/gigVisualStatus.ts',
  'src/context/reducers/crewReducer.ts',
  'src/components/stage/TourbusObstacleManager.ts',
  'src/context/expeditionActionCreators.ts',
  'src/utils/eventEngine/filterEvents.ts',
  'src/utils/objectUtils.ts',
  'src/components/stage/CrowdTextureManager.ts',
  'src/context/useCareerDispatchActions.ts',
  'src/components/assets/sectionTabs.ts',
  'src/context/reducers/careerReducer.ts',
  'src/utils/mapGenerator/types.ts',
  'src/components/assets/ForeclosureModal.tsx',
  'src/context/reducers/expeditionReducer.ts',
  'src/data/craftingRecipes.ts',
  'src/data/expedition/contracts.ts',
  'src/data/expedition/crewSignatureTraits.ts',
  'src/context/GameState.tsx',
  'src/App.tsx',
  'src/utils/brandOfferFlavor/hooks.ts',
  'src/utils/brandOfferFlavor/brandNames.ts',
  'src/context/GamepadInputContext.tsx',
  'src/components/stage/EffectTextureManager.ts',
  'src/hooks/gamepad/GamepadContext.ts',
  'src/utils/gamepad/inputSource.ts'
];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const res = scanDir(fullPath);
      if (res) return res;
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      if (blacklist.includes(fullPath)) continue;
      if (fullPath.endsWith('.d.ts')) continue;

      const content = fs.readFileSync(fullPath, 'utf8');

      // Look for a legacy JSDoc
      if (content.includes('@param {') || content.includes('@returns {')) {
         return fullPath;
      }

      // Or look for an exported function without a block comment right above it
      // A simple regex match for `export function` or `export const`
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('export function ') || lines[i].startsWith('export const ')) {
           if (i === 0 || !lines[i-1].trim().endsWith('*/')) {
              // Found something undocumented
              return fullPath;
           }
        }
      }
    }
  }
}

const target = scanDir('src');
console.log(target);
