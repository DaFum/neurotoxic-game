import json

def add_keys(filepath, cult_zealotry, zealotry_warning):
    with open(filepath, 'r') as f:
        data = json.load(f)

    data['social.cultZealotry'] = cult_zealotry
    data['social.zealotryWarning'] = zealotry_warning

    # Optional sorting
    data = dict(sorted(data.items()))

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')

add_keys('public/locales/en/economy.json', "CULT ZEALOTRY", "WARNING: FANS ARE BECOMING RADICALIZED. POLICE RAID RISK INCREASED.")
add_keys('public/locales/de/economy.json', "KULTFANATISMUS", "WARNUNG: FANS WERDEN FANATISCH. POLIZEIEINSATZ WAHRSCHEINLICH.")
