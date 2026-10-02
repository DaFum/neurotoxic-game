import re

with open("src/config/balance.ts", "r") as f:
    content = f.read()

# I accidentally added expenses again inside the parse function when I applied the previous python script!

# "    }\n  },\n  expenses: {\n    daily: { baseCost: 62 },\n    transport: { fuelPer100km: 10, fuelPrice: 1.75, maxFuel: 100, repairCostPerUnit: 6, insuranceMonthly: 80, maintenance30Days: 200 },\n    food: { fastFood: 8, restaurant: 15, energyDrink: 3, alcohol: 15 },\n    accommodation: { hostel: 25, hotel: 60 },\n    equipment: { strings: 15, sticks: 12, cable: 25, tubes: 80 },\n    admin: { proberaum: 180, insuranceEquip: 150 }\n  })\n}"

content = re.sub(
    r"    \}\n  \},\n  expenses: \{\n    daily: \{ baseCost: 62 \},\n    transport: \{ fuelPer100km: 10, fuelPrice: 1\.75, maxFuel: 100, repairCostPerUnit: 6, insuranceMonthly: 80, maintenance30Days: 200 \},\n    food: \{ fastFood: 8, restaurant: 15, energyDrink: 3, alcohol: 15 \},\n    accommodation: \{ hostel: 25, hotel: 60 \},\n    equipment: \{ strings: 15, sticks: 12, cable: 25, tubes: 80 \},\n    admin: \{ proberaum: 180, insuranceEquip: 150 \}\n  \}\)\n\}",
    r"    }\n  })\n}",
    content
)

# And fix `expenses: {` indentation
content = content.replace("expenses: {\n      daily: {\n        baseCost: readNumber(expenses, 'expenses', 'dailyBaseCost')\n      },", "    expenses: {\n      daily: {\n        baseCost: readNumber(expenses, 'expenses', 'dailyBaseCost')\n      },")

with open("src/config/balance.ts", "w") as f:
    f.write(content)
