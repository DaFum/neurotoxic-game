import re

with open("src/config/balance.ts", "r") as f:
    content = f.read()

# Replace finiteNumberOr logic with readNumber from the expenses object, which correctly uses the ranges.

replacement = """
    expenses: {
      daily: {
        baseCost: readNumber(expenses, 'expenses', 'dailyBaseCost')
      },
      transport: {
        fuelPer100km: readNumber(expenses, 'expenses', 'transportFuelPer100km'),
        fuelPrice: readNumber(expenses, 'expenses', 'transportFuelPrice'),
        maxFuel: readNumber(expenses, 'expenses', 'transportMaxFuel'),
        repairCostPerUnit: readNumber(expenses, 'expenses', 'transportRepairCostPerUnit'),
        insuranceMonthly: readNumber(expenses, 'expenses', 'transportInsuranceMonthly'),
        maintenance30Days: readNumber(expenses, 'expenses', 'transportMaintenance30Days')
      },
      food: {
        fastFood: readNumber(expenses, 'expenses', 'foodFastFood'),
        restaurant: readNumber(expenses, 'expenses', 'foodRestaurant'),
        energyDrink: readNumber(expenses, 'expenses', 'foodEnergyDrink'),
        alcohol: readNumber(expenses, 'expenses', 'foodAlcohol')
      },
      accommodation: {
        hostel: readNumber(expenses, 'expenses', 'accommodationHostel'),
        hotel: readNumber(expenses, 'expenses', 'accommodationHotel')
      },
      equipment: {
        strings: readNumber(expenses, 'expenses', 'equipmentStrings'),
        sticks: readNumber(expenses, 'expenses', 'equipmentSticks'),
        cable: readNumber(expenses, 'expenses', 'equipmentCable'),
        tubes: readNumber(expenses, 'expenses', 'equipmentTubes')
      },
      admin: {
        proberaum: readNumber(expenses, 'expenses', 'adminProberaum'),
        insuranceEquip: readNumber(expenses, 'expenses', 'adminInsuranceEquip')
      }
    }
"""

content = re.sub(
    r"    expenses: \{[\s\S]*?\n    \}",
    replacement.strip(),
    content
)

# We need `const expenses = readSection(record, 'expenses')` before returning.
content = re.sub(
    r"(const caps = readSection\(record, 'caps'\))\n",
    r"\1\n  const expenses = readSection(record, 'expenses')\n",
    content
)

# Wait, `readNumber` expects the field name in the object to be the same as the RangedKey. But my `RAW_DEFAULT_BALANCE_CONFIG.expenses` is nested.
# So `readNumber(expenses, 'expenses', 'dailyBaseCost')` looks for `expenses.dailyBaseCost`.
# This means I have to flatten the `RAW_DEFAULT_BALANCE_CONFIG` or write a custom `readNestedNumber` function. Let's write `readNestedNumber`.

with open("src/config/balance.ts", "w") as f:
    f.write(content)
