export function formatPu(pu: number): string {
  return pu.toLocaleString("en-GB", {
    minimumFractionDigits: pu % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatGbp(amount: number): string {
  return amount.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
