/**
 * Простое in-memory кэширование для результатов анализа рисков
 * В production можно заменить на Redis или другой persistent storage
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live в миллисекундах
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 часа

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const cache = new SimpleCache();

/**
 * Генерирует ключ кэша для анализа рисков на основе текста обязательства
 */
export function generateRiskCacheKey(clauseText: string, provisionId?: string, category?: string): string {
  // Используем хеш текста для создания уникального ключа
  const textHash = simpleHash(clauseText);
  return `risk:${provisionId || 'unknown'}:${category || 'unknown'}:${textHash}`;
}

/**
 * Простая хеш-функция для строк
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

