import json

with open('package.json', 'r') as f:
    data = json.load(f)

# Need to fix the duplicate 'test:fast' keys which json.load might have overwritten
# Actually json.load keeps the last one.
# Let's rebuild the scripts block properly.

scripts = data.get('scripts', {})
scripts['test'] = "pnpm run test:fast"
scripts['test:fast'] = "node ./scripts/run-fast-tests.mjs"
# remove the old "test:fast": "pnpm run test" if it exists in the raw text

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
