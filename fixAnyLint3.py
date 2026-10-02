import re

with open("src/config/balance.ts", "r") as f:
    content = f.read()

# Let's restore the finiteNumberOr method and just fix the typescript error.
# Or wait! The PR comment says:
# "Validate expense ranges instead of defaulting them: finiteNumberOr rejects non-numeric and non-finite inputs but accepts every finite value, so parseBalanceConfig accepts values such as fuelPrice: -10 or maxFuel: 200000 despite the newly declared ranges. Such a balance edit can boot successfully with negative travel costs or an invalid capacity; narrow the expenses section as unknown and validate each required field through the same range-checking path as the existing config sections."

# To fix this, I need to create a `readNestedNumber` that checks bounds using `RANGES`.

helper = """
const readNestedNumber = (
  section: Record<string, unknown>,
  subsection: string,
  key: string,
  rangeKey: RangedKey
): number => {
  if (!Object.hasOwn(section, subsection)) {
    throw new TypeError(`Balance config is missing ${subsection}.${key}`)
  }
  const sub = section[subsection]
  if (typeof sub !== 'object' || sub === null || Array.isArray(sub)) {
    throw new TypeError(`Balance config section "${subsection}" must be an object`)
  }
  const typedSub = sub as Record<string, unknown>
  if (!Object.hasOwn(typedSub, key)) {
    throw new TypeError(`Balance config is missing ${subsection}.${key}`)
  }
  const value = typedSub[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Balance config ${subsection}.${key} must be a number`)
  }
  const [min, max] = RANGES[rangeKey]
  if (value < min || value > max) {
    throw new RangeError(
      `Balance config ${subsection}.${key} (${value}) is outside allowed range [${min}, ${max}]`
    )
  }
  return value
}
"""

content = re.sub(
    r"(const readNumber = \([\s\S]*?\n\})",
    r"\1\n" + helper,
    content
)

replacement2 = """
    expenses: {
      daily: {
        baseCost: readNestedNumber(expenses, 'daily', 'baseCost', 'dailyBaseCost')
      },
      transport: {
        fuelPer100km: readNestedNumber(expenses, 'transport', 'fuelPer100km', 'transportFuelPer100km'),
        fuelPrice: readNestedNumber(expenses, 'transport', 'fuelPrice', 'transportFuelPrice'),
        maxFuel: readNestedNumber(expenses, 'transport', 'maxFuel', 'transportMaxFuel'),
        repairCostPerUnit: readNestedNumber(expenses, 'transport', 'repairCostPerUnit', 'transportRepairCostPerUnit'),
        insuranceMonthly: readNestedNumber(expenses, 'transport', 'insuranceMonthly', 'transportInsuranceMonthly'),
        maintenance30Days: readNestedNumber(expenses, 'transport', 'maintenance30Days', 'transportMaintenance30Days')
      },
      food: {
        fastFood: readNestedNumber(expenses, 'food', 'fastFood', 'foodFastFood'),
        restaurant: readNestedNumber(expenses, 'food', 'restaurant', 'foodRestaurant'),
        energyDrink: readNestedNumber(expenses, 'food', 'energyDrink', 'foodEnergyDrink'),
        alcohol: readNestedNumber(expenses, 'food', 'alcohol', 'foodAlcohol')
      },
      accommodation: {
        hostel: readNestedNumber(expenses, 'accommodation', 'hostel', 'accommodationHostel'),
        hotel: readNestedNumber(expenses, 'accommodation', 'hotel', 'accommodationHotel')
      },
      equipment: {
        strings: readNestedNumber(expenses, 'equipment', 'strings', 'equipmentStrings'),
        sticks: readNestedNumber(expenses, 'equipment', 'sticks', 'equipmentSticks'),
        cable: readNestedNumber(expenses, 'equipment', 'cable', 'equipmentCable'),
        tubes: readNestedNumber(expenses, 'equipment', 'tubes', 'equipmentTubes')
      },
      admin: {
        proberaum: readNestedNumber(expenses, 'admin', 'proberaum', 'adminProberaum'),
        insuranceEquip: readNestedNumber(expenses, 'admin', 'insuranceEquip', 'adminInsuranceEquip')
      }
    }
"""

content = re.sub(
    r"    expenses: \{[\s\S]*?\n    \}",
    replacement2.strip(),
    content
)

with open("src/config/balance.ts", "w") as f:
    f.write(content)
