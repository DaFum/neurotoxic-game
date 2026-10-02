import re

with open("src/config/balance.ts", "r") as f:
    content = f.read()

raw_expenses = """  expenses: {
    daily: { baseCost: 62 },
    transport: { fuelPer100km: 10, fuelPrice: 1.75, maxFuel: 100, repairCostPerUnit: 6, insuranceMonthly: 80, maintenance30Days: 200 },
    food: { fastFood: 8, restaurant: 15, energyDrink: 3, alcohol: 15 },
    accommodation: { hostel: 25, hotel: 60 },
    equipment: { strings: 15, sticks: 12, cable: 25, tubes: 80 },
    admin: { proberaum: 180, insuranceEquip: 150 }
  }"""

content = re.sub(
    r"(caps: \{[\s\S]*?\n  \})",
    r"\1,\n" + raw_expenses,
    content
)

with open("src/config/balance.ts", "w") as f:
    f.write(content)
