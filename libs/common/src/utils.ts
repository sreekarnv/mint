export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') return Number(obj);

  if (Array.isArray(obj)) return obj.map(serializeBigInt);

  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serializeBigInt(v)]),
    );
  }

  return obj;
}
