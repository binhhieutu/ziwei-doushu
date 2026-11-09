// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

function Switch() {
  const { theme, toggle } = useTheme();
  return <button onClick={toggle}>{theme}</button>;
}

describe('theme works with restricted browser storage', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  it('still renders and switches when both storage reads and writes are blocked', () => {
    vi.useFakeTimers();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() =>
      render(
        <ThemeProvider>
          <Switch />
        </ThemeProvider>,
      ),
    ).not.toThrow();
    fireEvent.click(screen.getByRole('button', { name: 'dark' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    vi.advanceTimersByTime(420);
    expect(
      document.documentElement.classList.contains('theme-transitioning'),
    ).toBe(false);
  });
  it('restores valid preferences and ignores invalid values', () => {
    localStorage.setItem('ziwei-theme', 'light');
    const view = render(
      <ThemeProvider>
        <Switch />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('light');
    view.unmount();
    localStorage.setItem('ziwei-theme', 'injected-value');
    document.documentElement.removeAttribute('data-theme');
    render(
      <ThemeProvider>
        <Switch />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('dark');
  });
});
