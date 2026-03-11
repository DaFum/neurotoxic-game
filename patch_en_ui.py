import json

file_path = 'public/locales/en/ui.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

data['gig.pause'] = 'Pause Game (ESC)'
data['gig.pauseAria'] = 'Pause Game'

# Keep keys sorted
sorted_data = dict(sorted(data.items()))

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(sorted_data, f, indent=2, ensure_ascii=False)
    f.write('\n')
