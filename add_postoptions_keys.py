import json

def add_keys(filepath, translations):
    with open(filepath, 'r') as f:
        data = json.load(f)

    for key, val in translations.items():
        data[key] = val

    data = dict(sorted(data.items()))

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')

en_translations = {
    "postOptions.radicalize_fans.name": "Radicalize Fans",
    "postOptions.radicalize_fans.message": "Your hardcore fans loved it. Casuals were disturbed."
}

de_translations = {
    "postOptions.radicalize_fans.name": "Fans radikalisieren",
    "postOptions.radicalize_fans.message": "Deine Hardcore-Fans liebten es. Gelegenheitsfans waren verstört."
}

add_keys('public/locales/en/ui.json', en_translations)
add_keys('public/locales/de/ui.json', de_translations)
