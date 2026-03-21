const fs = require('fs');
const file = 'src/scenes/Overworld.jsx';
let content = fs.readFileSync(file, 'utf8');

// remove unused imports
content = content.replace(/import \{ motion, AnimatePresence \} from 'framer-motion'\n/, '');
content = content.replace(/import \{ GlitchButton \} from '\.\.\/ui\/GlitchButton'\n/, '');
content = content.replace(/import \{ ALL_VENUES \} from '\.\.\/data\/venues'\n/, '');
content = content.replace(/import \{\n  EXPENSE_CONSTANTS,\n  calculateEffectiveTicketPrice\n\} from '\.\.\/utils\/economyEngine'\n/, "import { calculateEffectiveTicketPrice } from '../utils/economyEngine'\n");
content = content.replace(/import \{ GAME_PHASES \} from '\.\.\/context\/gameConstants'\n/, '');

fs.writeFileSync(file, content);
