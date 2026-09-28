/** Strip separators the registry and ledgers print (`-` or spaces). */
export function digitsOfKennitala(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Icelandic kennitala check digit (weights 3,2,7,6,5,4,3,2 on the first
 * eight digits; ninth is the check; tenth is the century marker).
 */
export function kennitalaChecksumOk(value: string): boolean {
  const digits = digitsOfKennitala(value);
  if (digits.length !== 10) return false;
  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(digits[i]) * (weights[i] ?? 0);
  }
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  if (check === 10) return false;
  return check === Number(digits[8]);
}
