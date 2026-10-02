import re

with open("src/config/balance.ts", "r") as f:
    content = f.read()

# 1. Bring back `readNestedNumber` and use it
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

# Read `expenses` section again
content = re.sub(
    r"(const caps = readSection\(record, 'caps'\))\n",
    r"\1\n  const expenses = readSection(record, 'expenses')\n",
    content
)

# 2. Update version to 4
content = re.sub(
    r"export const BALANCE_CONFIG_VERSION = 1",
    r"export const BALANCE_CONFIG_VERSION = 4",
    content
)
content = re.sub(
    r"export const BALANCE_CONFIG_VERSION = 2",
    r"export const BALANCE_CONFIG_VERSION = 4",
    content
)
content = re.sub(
    r"export const BALANCE_CONFIG_VERSION = 3",
    r"export const BALANCE_CONFIG_VERSION = 4",
    content
)

# 3. Clean up NestedUnknown
content = content.replace("type NestedUnknown = Record<string, Record<string, unknown> | undefined> | undefined\n\n", "")


with open("src/config/balance.ts", "w") as f:
    f.write(content)
