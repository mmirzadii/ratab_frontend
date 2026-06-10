export function getListResults<T>(
  data: { results?: readonly T[] } | readonly T[] | T | undefined
): T[] {
  if (Array.isArray(data)) {
    return [...data];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  if ("results" in data) {
    return [...((data as { results?: readonly T[] }).results ?? [])];
  }

  return [data as T];
}
