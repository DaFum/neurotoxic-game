import re

with open('tests/performance/EffectManager.bench.js', 'r') as f:
    content = f.read()

content = content.replace("console.log(`[Perf] 100k frames took: ${(end - start).toFixed(2)}ms`)",
                          "console.log(`[Perf] 100k frames took: ${(end - start).toFixed(2)}ms`)\n    import('vitest').then(({ expect }) => expect(end - start).toBeLessThan(1000))")

with open('tests/performance/EffectManager.bench.js', 'w') as f:
    f.write(content)
