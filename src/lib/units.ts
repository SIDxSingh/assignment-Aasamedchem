// Supported units per dimension:
// - Weight: g (base), kg (1 kg = 1000 g)
// - Volume: mL (base), L (1 L = 1000 mL)
// - Count: unit (base only)

export const UNIT_CONVERSIONS: Record<string, number> = {
  kg: 1000,
  g: 1,
  L: 1000,
  mL: 1,
  unit: 1,
};

export const UNIT_DIMENSIONS: Record<string, 'weight' | 'volume' | 'count'> = {
  kg: 'weight',
  g: 'weight',
  L: 'volume',
  mL: 'volume',
  unit: 'count',
};

/**
 * Converts a quantity from a source unit to its base unit.
 * e.g., 2 kg -> 2000 g
 */
export function toBaseUnit(value: number, fromUnit: string): number {
  const factor = UNIT_CONVERSIONS[fromUnit] || 1;
  return value * factor;
}

/**
 * Converts a quantity from its base unit to a target unit.
 * e.g., 2000 g -> 2 kg
 */
export function fromBaseUnit(value: number, toUnit: string): number {
  const factor = UNIT_CONVERSIONS[toUnit] || 1;
  return value / factor;
}

/**
 * Computes the unit price for a target unit given the price of 1 base unit.
 * e.g., if base unit is g and base price is 10 paise/g:
 * getPriceInUnit(10, 'kg') -> 10 * 1000 = 10000 paise/kg
 */
export function getPriceInUnit(basePricePerBaseUnit: number, targetUnit: string): number {
  const factor = UNIT_CONVERSIONS[targetUnit] || 1;
  return basePricePerBaseUnit * factor;
}

/**
 * Formats a value stored in paise (1 INR = 100 paise) as an INR currency string.
 * e.g., 123456 -> "₹1,234.56"
 */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Returns the list of compatible units for a given base unit.
 */
export function getCompatibleUnits(baseUnit: string): string[] {
  if (baseUnit === 'g') {
    return ['g', 'kg'];
  }
  if (baseUnit === 'mL') {
    return ['mL', 'L'];
  }
  return ['unit'];
}
