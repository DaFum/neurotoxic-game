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
    "crisis_police_raid_zealotry.title": "Police Raid",
    "crisis_police_raid_zealotry.desc": "The police raided your show due to radicalized fans!",
    "crisis_police_raid_zealotry.opt1.label": "Pay Fine",
    "crisis_police_raid_zealotry.opt1.outcome": "Lost money.",
    "crisis_police_raid_zealotry.opt2.label": "Resist",
    "crisis_police_raid_zealotry.opt2.outcome": "Increased controversy."
}

de_translations = {
    "crisis_police_raid_zealotry.title": "Polizeirazzia",
    "crisis_police_raid_zealotry.desc": "Die Polizei hat eure Show wegen radikalisierter Fans gestürmt!",
    "crisis_police_raid_zealotry.opt1.label": "Strafe zahlen",
    "crisis_police_raid_zealotry.opt1.outcome": "Geld verloren.",
    "crisis_police_raid_zealotry.opt2.label": "Widerstand leisten",
    "crisis_police_raid_zealotry.opt2.outcome": "Kontroverse erhöht."
}

add_keys('public/locales/en/events.json', en_translations)
add_keys('public/locales/de/events.json', de_translations)
