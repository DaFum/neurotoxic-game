import re

filepath = "src/ui/bandhq/BrandDealsTab.tsx"
with open(filepath, "r") as f:
    content = f.read()

search_pattern = """  const activeDealIds = useMemo(() => {
    const deals = social?.activeDeals || []
    const ids = []
    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i]
      if (deal && deal.id) ids.push(deal.id)
    }
    return new Set(ids)
  }, [social?.activeDeals])"""

replace_pattern = """  const activeDealIds = useMemo(() => {
    const deals = social?.activeDeals || []
    const ids = new Set<string>()
    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i]
      if (deal && typeof deal.id === 'string') ids.add(deal.id)
    }
    return ids
  }, [social?.activeDeals])"""

if search_pattern in content:
    content = content.replace(search_pattern, replace_pattern)
    with open(filepath, "w") as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Pattern not found")
