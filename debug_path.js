import { getMessyPath } from './src/scenes/kabelsalat/kabelsalatUtils.ts';

const MOCK_SLOT_XS = [100, 200, 300, 400, 500];

const path = getMessyPath('iec', 'mic', ['power', 'mic', 'amp']);
console.log(path);
