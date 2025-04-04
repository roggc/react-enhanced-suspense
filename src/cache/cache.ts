// cache.ts
const memoryCache = new Map<
  string,
  { value: any; timestamp?: number | undefined }
>();

/**
 * Borra una entrada del caché basada en su cacheKey.
 * @param cacheKey - La clave única del caché a eliminar.
 */
export function clearCache(cacheKey: string) {
  if (!cacheKey) return;
  memoryCache.delete(cacheKey);
  localStorage.removeItem(cacheKey);
}

/**
 * Borra una entrada solo del localStorage sin afectar la memoria.
 * @param cacheKey - La clave única del caché a eliminar de localStorage.
 */
export function clearLocalStorageOnly(cacheKey: string) {
  if (!cacheKey) return;
  localStorage.removeItem(cacheKey);
}

export function setLocalStorageOnly(cacheKey: string) {
  if (!cacheKey) return;
  const entry = memoryCache.get(cacheKey);
  if (entry !== undefined) {
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  }
}

/**
 * Almacena un valor en el caché con una clave y un TTL opcional.
 * @param cacheKey - La clave única para identificar el valor.
 * @param value - El valor a almacenar.
 * @param ttl - Tiempo de vida en milisegundos (opcional).
 * @param persist - Si true, almacena en localStorage además de en memoria; si false, solo en memoria (default: false).
 */
export function setCache(
  cacheKey: string,
  value: any,
  ttl?: number,
  persist: boolean = false
) {
  if (!cacheKey) return;
  const entry = {
    value,
    timestamp: ttl ? Date.now() + ttl : undefined,
  };
  memoryCache.set(cacheKey, entry);
  if (persist) {
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  }
}

/**
 * Obtiene un valor del caché si existe y no ha expirado, priorizando la memoria.
 * @param cacheKey - La clave única del caché a buscar.
 * @returns El valor almacenado o undefined si no existe o ha expirado.
 */
export function getCache(cacheKey: string) {
  if (!cacheKey) return;
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry !== undefined) {
    if (memoryEntry.timestamp && Date.now() > memoryEntry.timestamp) {
      memoryCache.delete(cacheKey);
      localStorage.removeItem(cacheKey);
      return undefined;
    }
    return memoryEntry.value;
  }
  const cached = localStorage.getItem(cacheKey);
  if (cached !== null) {
    const entry = JSON.parse(cached);
    if (entry.timestamp && Date.now() > entry.timestamp) {
      localStorage.removeItem(cacheKey);
      return undefined;
    }
    memoryCache.set(cacheKey, entry);
    return entry.value;
  }
  return undefined;
}
