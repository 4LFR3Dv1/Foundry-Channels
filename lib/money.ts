export function formatBaseUnits(value: bigint, decimals: number, maximumFractionDigits = 6): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const scale = 10n ** BigInt(decimals);
  const whole = absolute / scale;
  const fraction = absolute % scale;
  const fractionText = fraction.toString().padStart(decimals, "0").slice(0, maximumFractionDigits).replace(/0+$/, "");
  const text = fractionText ? `${whole}.${fractionText}` : whole.toString();
  return negative ? `-${text}` : text;
}

export function percentage(part: bigint, total: bigint): number {
  if (total <= 0n || part <= 0n) return 0;
  return Math.max(0, Math.min(100, Number((part * 10_000n) / total) / 100));
}
