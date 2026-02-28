import fs from 'fs';
import path from 'path';

const fixUiDotKeys = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixUiDotKeys(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let modified = false;

            // map keys
            if (content.includes("t('ui:day'")) {
                content = content.replace(/t\('ui:day'/g, "t('ui:ui.day'");
                modified = true;
            }
            if (content.includes("t('ui:level'")) {
                content = content.replace(/t\('ui:level'/g, "t('ui:ui.level'");
                modified = true;
            }
            if (content.includes("t('ui:time'")) {
                content = content.replace(/t\('ui:time'/g, "t('ui:ui.time'");
                modified = true;
            }
            if (content.includes("t('ui:location'")) {
                content = content.replace(/t\('ui:location'/g, "t('ui:ui.location'");
                modified = true;
            }
            if (content.includes("t('ui:owned'")) {
                content = content.replace(/t\('ui:owned'/g, "t('ui:ui.owned'");
                modified = true;
            }
            if (content.includes("t('ui:locked'")) {
                content = content.replace(/t\('ui:locked'/g, "t('ui:ui.locked'");
                modified = true;
            }


            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf-8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
};

fixUiDotKeys('./src');
