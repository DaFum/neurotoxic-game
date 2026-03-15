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

if __name__ == '__main__':
    en_updates = {
        "report.amount_with_currency": "€{{amount}}",
        "report.amount_positive": "+€{{amount}}",
        "report.amount_negative": "-€{{amount}}",
        "ui:postGig.dealFailed": "Deal failed",
        "ui:postGig.negotiationFailed": "Negotiation failed unexpectedly"
    }

    de_updates = {
        "report.amount_with_currency": "{{amount}} €",
        "report.amount_positive": "+{{amount}} €",
        "report.amount_negative": "-{{amount}} €",
        "ui:postGig.dealFailed": "Deal fehlgeschlagen",
        "ui:postGig.negotiationFailed": "Verhandlung unerwartet fehlgeschlagen"
    }

    update_json("public/locales/en/economy.json", en_updates)
    update_json("public/locales/de/economy.json", de_updates)

    ui_en_updates = {
        "postGig.dealFailed": "Deal failed",
        "postGig.negotiationFailed": "Negotiation failed unexpectedly"
    }

    ui_de_updates = {
        "postGig.dealFailed": "Deal fehlgeschlagen",
        "postGig.negotiationFailed": "Verhandlung unerwartet fehlgeschlagen"
    }

    update_json("public/locales/en/ui.json", ui_en_updates)
    update_json("public/locales/de/ui.json", ui_de_updates)

    print("Updated locales.")
