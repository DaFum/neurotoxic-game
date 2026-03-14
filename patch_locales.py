import json
import os

for locale in ['en', 'de']:
    path = f"public/locales/{locale}/ui.json"
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if locale == 'en':
            data['clinic.heal_button'] = 'HEAL ({{cost}}€)'
        else:
            data['clinic.heal_button'] = 'HEILEN ({{cost}}€)'

        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')
