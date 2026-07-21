/** Round to n decimal places using half-up (financial). */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function roundPu(value: number): number {
  return roundTo(value, 2);
}

export function roundMoney(value: number): number {
  return roundTo(value, 2);
}

export function sumVector(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

export function personWeeksFromPu(pu: number): number {
  return roundPu(pu / 5);
}
