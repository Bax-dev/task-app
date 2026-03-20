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

    const applyTheme = (isDark: boolean) => {
      const primary = isDark ? theme.primaryDark : theme.primary;
      root.style.setProperty('--primary', primary);
      root.style.setProperty('--ring', primary);

      const hueMatch = primary.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
      if (hueMatch) {
        const lightness = parseFloat(hueMatch[1]);
        const hue = hueMatch[3];
        // Use dark foreground for light primaries, light foreground for dark primaries
        if (lightness > 0.6) {
          root.style.setProperty('--primary-foreground', `oklch(0.2 0.005 ${hue})`);
        } else {
          root.style.setProperty('--primary-foreground', isDark ? `oklch(0.12 0.003 ${hue})` : 'oklch(1 0 0)');
        }
        root.style.setProperty('--secondary', isDark ? `oklch(0.3 0.006 ${hue})` : `oklch(0.93 0.025 ${hue})`);
        root.style.setProperty('--secondary-foreground', isDark ? `oklch(0.9 0.004 ${hue})` : primary);
      }
    };

    applyTheme(root.classList.contains('dark'));

    // Listen for dark mode changes
    const observer = new MutationObserver(() => {
      applyTheme(root.classList.contains('dark'));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [themeColorId]);

  return null;
}
