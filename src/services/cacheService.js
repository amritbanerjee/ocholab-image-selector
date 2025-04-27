import { createClient } from '@supabase/supabase-js';

const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

class CacheService {
  constructor(supabase) {
    this.supabase = supabase;
    this.cache = new Map();
  }

  async get(key) {
    const cachedItem = this.cache.get(key);
    
    if (cachedItem && Date.now() < cachedItem.expiry) {
      return cachedItem.value;
    }
    
    // If expired or not found, remove from cache
    this.cache.delete(key);
    return null;
  }

  async set(key, value, ttl = CACHE_EXPIRY) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  async fetchWithCache(queryKey, fetchFn) {
    const cached = await this.get(queryKey);
    if (cached) {
      return cached;
    }
    
    const data = await fetchFn();
    await this.set(queryKey, data);
    return data;
  }

  clear() {
    this.cache.clear();
  }

  async invalidate(key) {
    this.cache.delete(key);
  }
}

export default CacheService;