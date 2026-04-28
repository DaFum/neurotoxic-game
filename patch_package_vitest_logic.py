import json

with open('package.json', 'r') as f:
    data = json.load(f)

scripts = data.get('scripts', {})
scripts['test:vitest:logic'] = "vitest run --config vitest.config.node.js"

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
