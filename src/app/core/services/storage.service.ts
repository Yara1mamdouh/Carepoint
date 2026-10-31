import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly prefix = 'carepoint_pro_';

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem<T>(key: string, defaultValue: T): T {
    if (!this.isLocalStorageAvailable()) {
      return defaultValue;
    }

    try {
      const stored = window.localStorage.getItem(this.prefix + key);
      if (stored === null) {
        return defaultValue;
      }
      return JSON.parse(stored) as T;
    } catch (e) {
      console.warn(`[StorageService] Failed to parse key "${key}":`, e);
      return defaultValue;
    }
  }

  setItem<T>(key: string, value: T): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(this.prefix + key, serialized);
    } catch (e) {
      console.error(`[StorageService] Failed to store key "${key}":`, e);
    }
  }

  removeItem(key: string): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    window.localStorage.removeItem(this.prefix + key);
  }

  clearAll(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => window.localStorage.removeItem(k));
  }
}
