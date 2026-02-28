import fs from 'fs';
import path from 'path';

// Find files containing missing ui: namespaces
const fixTranslationKeys = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixTranslationKeys(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let modified = false;

            // map keys
            if (content.includes("t('map.")) {
                content = content.replace(/t\('map\./g, "t('ui:map.");
                modified = true;
            }

            // hq keys
            if (content.includes("t('hq.")) {
                content = content.replace(/t\('hq\./g, "t('ui:hq.");
                modified = true;
            }

            // stats keys
            if (content.includes("t('stats.")) {
                content = content.replace(/t\('stats\./g, "t('ui:stats.");
                modified = true;
            }

            // ui. keys (replace dot with colon)
            if (content.includes("t('ui.")) {
                content = content.replace(/t\('ui\./g, "t('ui:");
                modified = true;
            }

            if (content.includes("t('venues:' + ")) {
                content = content.replace(/t\('venues:' \+ player\.location \+ '\.name'/g, "t(`venues:${player.location}.name`");
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf-8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
};

fixTranslationKeys('./src');
