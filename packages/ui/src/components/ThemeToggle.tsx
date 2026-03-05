import { useThemeStore } from '../store';

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className="
        relative inline-flex h-8 w-[60px] shrink-0 items-center rounded-full cursor-pointer
        border border-[var(--sf-control-border)]
        bg-[var(--sf-control-bg)]
        transition-all duration-200 ease-[var(--sf-ease-standard)]
        hover:border-[var(--sf-control-border-hover)] hover:shadow-sm
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-bg-1)]
      "
    >
      {/* Sliding thumb */}
      <span
        className={`
          pointer-events-none absolute flex h-6 w-6 items-center justify-center rounded-full
          bg-[var(--sf-accent)] shadow-sm
          transition-transform duration-200 ease-[var(--sf-ease-standard)]
          ${isDark ? 'translate-x-[30px]' : 'translate-x-[2px]'}
        `}
        aria-hidden="true"
      >
        {/* Sun icon (light mode) */}
        <svg
          className={`absolute h-3.5 w-3.5 text-white transition-opacity duration-150 ${isDark ? 'opacity-0' : 'opacity-100'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M8.34 15.66l-1.41 1.41m12.14 0l-1.41-1.41M8.34 8.34L6.93 6.93" />
        </svg>

        {/* Moon icon (dark mode) */}
        <svg
          className={`absolute h-3.5 w-3.5 text-white transition-opacity duration-150 ${isDark ? 'opacity-100' : 'opacity-0'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      </span>
    </button>
  );
}
