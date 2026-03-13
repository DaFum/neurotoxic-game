import json

def add_keys(filepath, cult_donations):
    with open(filepath, 'r') as f:
        data = json.load(f)

    data['cultDonations'] = cult_donations

    # Optional sorting
    data = dict(sorted(data.items()))

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')

add_keys('public/locales/en/economy.json', "Cult Donations")
add_keys('public/locales/de/economy.json', "Kultspenden")
