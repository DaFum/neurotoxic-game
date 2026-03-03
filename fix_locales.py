import json
import os

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    sorted_data = {k: data[k] for k in sorted(data.keys())}
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(sorted_data, f, indent=2, ensure_ascii=False)
        f.write('\n')

en_events = load_json('public/locales/en/events.json')
de_events = load_json('public/locales/de/events.json')
en_ui = load_json('public/locales/en/ui.json')
de_ui = load_json('public/locales/de/ui.json')

# 1. Fix crisis_venue_cancels.opt1.label in DE
if "crisis_venue_cancels.opt1.label" in de_events:
    de_events["crisis_venue_cancels.opt1.label"] = "Absage akzeptieren [-150€ Kaution]"

# 2. Translate quest_trigger_* in DE
de_events.update({
    "quest_trigger_harmony_project.desc": "Der Bassist und der Sänger streiten sich darum, wer den letzten veganen Donut gegessen hat. Klär das, bevor sich die Band auflöst.",
    "quest_trigger_harmony_project.opt1.label": "Wir brauchen eine geile Show, um uns wieder zu binden.",
    "quest_trigger_harmony_project.opt1.outcome": "Quest hinzugefügt: Projekt Harmonie-Wiederherstellung.",
    "quest_trigger_harmony_project.title": "HARMONIE WIEDERHERSTELLUNG",
    "quest_trigger_local_legend.desc": "Ein lokaler Radio-DJ hat uns live herausgefordert. Zeigt, dass wir die lauteste Band der Stadt sind!",
    "quest_trigger_local_legend.opt1.label": "Herausforderung angenommen.",
    "quest_trigger_local_legend.opt1.outcome": "Quest hinzugefügt: Lokale Legende.",
    "quest_trigger_local_legend.opt2.label": "Ignoriere den DJ.",
    "quest_trigger_local_legend.opt2.outcome": "Du hast die Herausforderung ignoriert.",
    "quest_trigger_local_legend.title": "LOKALE LEGENDE HERAUSFORDERUNG",
    "quest_trigger_pick_of_destiny.desc": "Der Gitarrist hat sein Glücks-Plektrum in einem Sofakissen verloren. Wir müssen unsere Schritte zurückverfolgen... zu drei verschiedenen Bars.",
    "quest_trigger_pick_of_destiny.opt1.label": "Beginne die Suche!",
    "quest_trigger_pick_of_destiny.opt1.outcome": "Quest hinzugefügt: Finde das Plektrum des Schicksals.",
    "quest_trigger_pick_of_destiny.opt2.label": "Es ist nur ein Plektrum.",
    "quest_trigger_pick_of_destiny.opt2.outcome": "Du hast es ignoriert.",
    "quest_trigger_pick_of_destiny.title": "VERLORENES PLEKTRUM DES SCHICKSALS",
    "quest_trigger_sponsor_demand.desc": "Unser neuer Sponsor 'Toxic Sludge Energy' will, dass wir zwei Shows in passenden Neon-Trainingsanzügen spielen. Mach's für die Kohle.",
    "quest_trigger_sponsor_demand.opt1.label": "Akzeptiere den bizarren Vertrag.",
    "quest_trigger_sponsor_demand.opt1.outcome": "Quest hinzugefügt: Bizarre Forderung des Sponsors.",
    "quest_trigger_sponsor_demand.opt2.label": "Ablehnen.",
    "quest_trigger_sponsor_demand.opt2.outcome": "Du hast den Sponsor abgelehnt.",
    "quest_trigger_sponsor_demand.title": "BIZARRE FORDERUNG DES SPONSORS",
    "quest_trigger_viral_dance.desc": "Der Drummer hat aus Versehen einen viralen Tanz kreiert, als er über einen Mikrofonständer gestolpert ist. Wir haben ein paar Tage, um das maximal auszunutzen!",
    "quest_trigger_viral_dance.opt1.label": "Nutz es aus! [Quest hinzufügen]",
    "quest_trigger_viral_dance.opt1.outcome": "Quest hinzugefügt: Der virale TikTok-Tanz.",
    "quest_trigger_viral_dance.opt2.label": "Lass es vergehen.",
    "quest_trigger_viral_dance.opt2.outcome": "Du hast das Momentum verloren.",
    "quest_trigger_viral_dance.title": "DER VIRALE VORFALL"
})

# 3. Fix DE ui.json quests.empty and quests.title
de_ui.update({
    "quests.empty": "Keine aktiven Quests. Geh auf Tour, um welche zu finden!",
    "quests.title": "AKTIVE QUESTS",
    "quests.button": "QUESTS"
})
en_ui.update({
    "quests.button": "QUESTS",
    "quests.days.singular": "Day Left",
    "quests.days.plural": "Days Left",
    "quests.progress": "Progress",
    "quests.rewards": "Rewards:",
    "rewards.freeItem": "Free Item",
    "rewards.fans": "Fans",
    "rewards.skillPoint": "Skill Point",
    "rewards.harmony": "Harmony",
    "rewards.special": "Special"
})
de_ui.update({
    "quests.days.singular": "Tag übrig",
    "quests.days.plural": "Tage übrig",
    "quests.progress": "Fortschritt",
    "quests.rewards": "Belohnungen:",
    "rewards.freeItem": "Kostenloses Item",
    "rewards.fans": "Fans",
    "rewards.skillPoint": "Skill-Punkt",
    "rewards.harmony": "Harmonie",
    "rewards.special": "Spezial"
})

# 4. Fix gear_theft.opt3.* in EN events.json (they are currently German)
if "gear_theft.opt3.d_6b9d" in en_events:
    en_events["gear_theft.opt3.d_6b9d"] = "Attempt to steal it back [Skill Check]"
if "gear_theft.opt3.label" in en_events:
    en_events["gear_theft.opt3.label"] = "Attempt to steal it back [Improv]"
if "gear_theft.opt3.outcome" in en_events:
    en_events["gear_theft.opt3.outcome"] = "You recovered the gear but barely escaped."

# 5. Fix DE ui.json featureList
# Looking at public/locales/de/ui.json, featureList properties might be untranslated.
for k, v in en_ui.items():
    if k.startswith("featureList.") and k in de_ui:
        # We don't have exact translations, so we'll just keep the EN ones if they're identical
        # Actually, let me just print them first to see what's going on
        pass

# Add quest labels for quests.js
en_events.update({
    "quest_pick_of_destiny.label": "Find the Pick of Destiny",
    "quest_pick_of_destiny.desc": "Travel to 3 different venues to find the lost pick.",
    "quest_viral_dance.label": "The Viral TikTok Dance",
    "quest_viral_dance.desc": "Gain 500 TikTok followers.",
    "quest_sponsor_demand.label": "Sponsor's Bizarre Demand",
    "quest_sponsor_demand.desc": "Play 2 gigs to satisfy the sponsor.",
    "quest_harmony_project.label": "Harmony Restoration Project",
    "quest_harmony_project.desc": "Successfully complete 1 gig with a high rating to restore harmony.",
    "quest_local_legend.label": "Local Legend",
    "quest_local_legend.desc": "Earn 500 fans in total."
})

de_events.update({
    "quest_pick_of_destiny.label": "Finde das Plektrum des Schicksals",
    "quest_pick_of_destiny.desc": "Reise zu 3 verschiedenen Venues, um das verlorene Plektrum zu finden.",
    "quest_viral_dance.label": "Der virale TikTok-Tanz",
    "quest_viral_dance.desc": "Gewinne 500 TikTok-Follower.",
    "quest_sponsor_demand.label": "Bizarre Forderung des Sponsors",
    "quest_sponsor_demand.desc": "Spiele 2 Gigs, um den Sponsor zufriedenzustellen.",
    "quest_harmony_project.label": "Projekt Harmonie-Wiederherstellung",
    "quest_harmony_project.desc": "Schließe 1 Gig erfolgreich mit hoher Bewertung ab, um Harmonie wiederherzustellen.",
    "quest_local_legend.label": "Lokale Legende",
    "quest_local_legend.desc": "Gewinne insgesamt 500 Fans."
})


save_json('public/locales/en/events.json', en_events)
save_json('public/locales/de/events.json', de_events)
save_json('public/locales/en/ui.json', en_ui)
save_json('public/locales/de/ui.json', de_ui)
