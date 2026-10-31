import { Injectable, signal, inject, effect } from '@angular/core';
import { StorageService } from './storage.service';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly STORAGE_KEY = 'app_theme_mode';

  // Reactive Signal for current theme
  readonly currentTheme = signal<ThemeMode>(this.getInitialTheme());

  constructor() {
    // Synchronize DOM attributes whenever the theme signal changes
    effect(() => {
      const mode = this.currentTheme();
      this.applyThemeToDom(mode);
      this.storage.setItem(this.STORAGE_KEY, mode);
    });
  }

  private getInitialTheme(): ThemeMode {
    const saved = this.storage.getItem<ThemeMode | null>(this.STORAGE_KEY, null);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  private applyThemeToDom(theme: ThemeMode): void {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      html.setAttribute('data-bs-theme', theme);
      html.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      }
    }
  }

  toggleTheme(): void {
    this.currentTheme.update(prev => (prev === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
  }

  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }
}
