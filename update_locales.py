import json
import os

def update_json(filepath, updates):
    if not os.path.exists(filepath):
        print(f"{filepath} not found.")
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for k, v in updates.items():
        data[k] = v

    sorted_data = dict(sorted(data.items()))

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(sorted_data, f, indent=2, ensure_ascii=False)
        f.write("\n")

en_updates = {
    "report.amount_with_currency": "€{{amount}}",
    "report.amount_positive": "+€{{amount}}",
    "report.amount_negative": "-€{{amount}}"
}

de_updates = {
    "report.amount_with_currency": "{{amount}} €",
    "report.amount_positive": "+{{amount}} €",
    "report.amount_negative": "-{{amount}} €"
}

update_json("public/locales/en/economy.json", en_updates)
update_json("public/locales/de/economy.json", de_updates)
print("Updated locales.")
