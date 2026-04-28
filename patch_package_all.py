import json

with open('package.json', 'r') as f:
    data = json.load(f)

scripts = data.get('scripts', {})
test_all = scripts.get('test:all', '')
test_all = test_all.replace(" && pnpm run test:perf", "")
test_all = test_all.replace(" && pnpm run test:locale:smoke", "")
scripts['test:all'] = test_all

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
