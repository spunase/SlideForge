import { useThemeStore } from './themeStore';
import type { Theme } from './themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    useThemeStore.setState({ theme: 'dark' });
  });

  it('defaults to dark theme', () => {
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('setTheme updates theme to light', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('sf-theme')).toBe('light');
  });

  it('setTheme updates theme to dark', () => {
    useThemeStore.getState().setTheme('light');
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    expect(localStorage.getItem('sf-theme')).toBe('dark');
  });

  it('toggleTheme flips from dark to light', () => {
    useThemeStore.setState({ theme: 'dark' });
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggleTheme flips from light to dark', () => {
    useThemeStore.setState({ theme: 'light' });
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('persists theme to localStorage', () => {
    useThemeStore.getState().setTheme('light');
    expect(localStorage.getItem('sf-theme')).toBe('light');
    useThemeStore.getState().setTheme('dark');
    expect(localStorage.getItem('sf-theme')).toBe('dark');
  });

  it('exports Theme type correctly', () => {
    const t: Theme = 'dark';
    expect(t).toBe('dark');
  });
});
