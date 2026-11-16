export function searchTreks<T extends { name: string }>(treks: readonly T[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  return normalized
    ? treks.filter((trek) => trek.name.toLowerCase().includes(normalized))
    : [...treks];
}
