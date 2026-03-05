import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeToggle } from './ThemeToggle';
import { useThemeStore } from '../store';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    useThemeStore.setState({ theme: 'dark' });
  });

  it('renders a switch with correct role', () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('shows aria-checked true when in dark mode (default)', () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('shows aria-checked false when in light mode', () => {
    useThemeStore.setState({ theme: 'light' });
    render(<ThemeToggle />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('has correct aria-label in dark mode (default)', () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('has correct aria-label in light mode', () => {
    useThemeStore.setState({ theme: 'light' });
    render(<ThemeToggle />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('toggles theme on click', () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(useThemeStore.getState().theme).toBe('light');
    fireEvent.click(toggle);
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
