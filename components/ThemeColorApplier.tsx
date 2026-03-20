'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectThemeColorId, THEME_COLORS } from '@/store/slices/preferencesSlice';

export default function ThemeColorApplier() {
  const themeColorId = useAppSelector(selectThemeColorId);

  useEffect(() => {
    const theme = THEME_COLORS.find((t) => t.id === themeColorId);
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--ring', theme.primary);

    // Also update the secondary to match
    const hueMatch = theme.primary.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
    if (hueMatch) {
      const hue = hueMatch[3];
      root.style.setProperty('--secondary', `oklch(0.93 0.025 ${hue})`);
      root.style.setProperty('--secondary-foreground', theme.primary);
    }

    // Check if dark mode is active and apply dark variant
    const isDark = root.classList.contains('dark');
    if (isDark) {
      root.style.setProperty('--primary', theme.primaryDark);
      root.style.setProperty('--ring', theme.primaryDark);
    }

    // Listen for dark mode changes
    const observer = new MutationObserver(() => {
      const nowDark = root.classList.contains('dark');
      root.style.setProperty('--primary', nowDark ? theme.primaryDark : theme.primary);
      root.style.setProperty('--ring', nowDark ? theme.primaryDark : theme.primary);
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [themeColorId]);

  return null;
}
