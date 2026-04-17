'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectThemeColorId,
  selectCustomThemeColors,
  THEME_COLORS,
} from '@/store/slices/preferencesSlice';

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function mix(hex: string, amount: number, toward: 'white' | 'black'): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const target = toward === 'white' ? 255 : 0;
  const [r, g, b] = rgb.map((c) => Math.round(c + (target - c) * amount)) as [number, number, number];
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export default function ThemeColorApplier() {
  const themeColorId = useAppSelector(selectThemeColorId);
  const customThemeColors = useAppSelector(selectCustomThemeColors);

  useEffect(() => {
    const all = [...THEME_COLORS, ...customThemeColors];
    const theme = all.find((t) => t.id === themeColorId) || THEME_COLORS[0];
    if (!theme) return;

    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      const primary = isDark ? theme.primaryDark : theme.primary;
      root.style.setProperty('--primary', primary);
      root.style.setProperty('--ring', primary);

      // Hex path — compute foreground + soft secondary from luminance
      if (primary.startsWith('#')) {
        const rgb = hexToRgb(primary);
        if (rgb) {
          const lum = relativeLuminance(rgb);
          const fg = lum > 0.5 ? '#111827' : '#ffffff';
          root.style.setProperty('--primary-foreground', fg);
          const secondary = isDark
            ? mix(primary, 0.75, 'black')
            : mix(primary, 0.85, 'white');
          const secondaryFg = isDark ? '#e5e7eb' : primary;
          root.style.setProperty('--secondary', secondary);
          root.style.setProperty('--secondary-foreground', secondaryFg);
          root.style.setProperty('--accent', secondary);
          root.style.setProperty('--accent-foreground', isDark ? '#e5e7eb' : primary);
        }
        return;
      }

      // OKLch path — derive from hue component
      root.style.setProperty('--accent', isDark ? 'oklch(0.25 0.005 240)' : 'oklch(0.93 0.004 240)');
      root.style.setProperty('--accent-foreground', isDark ? 'oklch(0.88 0.006 240)' : 'oklch(0.2 0.01 240)');
      const hueMatch = primary.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
      if (hueMatch) {
        const lightness = parseFloat(hueMatch[1]);
        const hue = hueMatch[3];
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

    const observer = new MutationObserver(() => {
      applyTheme(root.classList.contains('dark'));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [themeColorId, customThemeColors]);

  return null;
}
