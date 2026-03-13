import json

def add_keys(filepath, translations):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for key, val in translations.items():
        data[key] = val

    data = dict(sorted(data.items()))

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')

en_economy = {
    "social.cultZealotry": "CULT ZEALOTRY",
    "social.zealotryWarning": "WARNING: FANS ARE BECOMING RADICALIZED. POLICE RAID RISK INCREASED.",
    "cultDonations": "Cult Donations"
}

de_economy = {
    "social.cultZealotry": "KULTFANATISMUS",
    "social.zealotryWarning": "WARNUNG: FANS WERDEN FANATISCH. POLIZEIEINSATZ WAHRSCHEINLICH.",
    "cultDonations": "Kultspenden"
}

en_events = {
    "crisis_police_raid_zealotry.title": "Police Raid",
    "crisis_police_raid_zealotry.desc": "The police raided your show!",
    "crisis_police_raid_zealotry.opt1.label": "Pay Fine",
    "crisis_police_raid_zealotry.opt1.outcome": "Lost money.",
    "crisis_police_raid_zealotry.opt2.label": "Resist",
    "crisis_police_raid_zealotry.opt2.outcome": "Increased controversy."
}

de_events = {
    "crisis_police_raid_zealotry.title": "Polizeirazzia",
    "crisis_police_raid_zealotry.desc": "Die Polizei hat eure Show wegen radikalisierter Fans gestürmt!",
    "crisis_police_raid_zealotry.opt1.label": "Strafe zahlen",
    "crisis_police_raid_zealotry.opt1.outcome": "Geld verloren.",
    "crisis_police_raid_zealotry.opt2.label": "Widerstand leisten",
    "crisis_police_raid_zealotry.opt2.outcome": "Kontroverse erhöht."
}

en_ui = {
    "postOptions.radicalize_fans.name": "Radicalize Fans",
    "postOptions.radicalize_fans.message": "Your hardcore fans loved it. Casuals were disturbed."
}

de_ui = {
    "postOptions.radicalize_fans.name": "Fans radikalisieren",
    "postOptions.radicalize_fans.message": "Deine Hardcore-Fans liebten es. Gelegenheitsfans waren verstört."
}

add_keys('public/locales/en/economy.json', en_economy)
add_keys('public/locales/de/economy.json', de_economy)
add_keys('public/locales/en/events.json', en_events)
add_keys('public/locales/de/events.json', de_events)
add_keys('public/locales/en/ui.json', en_ui)
add_keys('public/locales/de/ui.json', de_ui)
