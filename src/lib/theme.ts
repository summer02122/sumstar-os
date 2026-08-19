// Color theme presets and utilities for SumStar OS

export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  primaryColor: string;
  background: string;
  surface: string;
  surface2: string;
  accent: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'pink',
    name: 'Salmon Pink',
    emoji: '🌸',
    primaryColor: '#000000',
    background: '#FFCAD4',
    surface: '#FFE5EC',
    surface2: '#FFF0F3',
    accent: '#FF85A1',
  },
  {
    id: 'yellow',
    name: 'Warm Studio',
    emoji: '💛',
    primaryColor: '#000000',
    background: '#FDE047',
    surface: '#FEF08A',
    surface2: '#FEF9C3',
    accent: '#EAB308',
  },
  {
    id: 'blue',
    name: 'Sky Editorial',
    emoji: '💙',
    primaryColor: '#000000',
    background: '#BAE6FD',
    surface: '#E0F2FE',
    surface2: '#F0F9FF',
    accent: '#38BDF8',
  },
  {
    id: 'green',
    name: 'Mint Creative',
    emoji: '🌿',
    primaryColor: '#000000',
    background: '#BBF7D0',
    surface: '#DCFCE7',
    surface2: '#F0FDF4',
    accent: '#4ADE80',
  },
  {
    id: 'purple',
    name: 'Lavender Studio',
    emoji: '💜',
    primaryColor: '#000000',
    background: '#DDD6FE',
    surface: '#EDE9FE',
    surface2: '#F5F3FF',
    accent: '#A78BFA',
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    emoji: '🍊',
    primaryColor: '#000000',
    background: '#FED7AA',
    surface: '#FFEDD5',
    surface2: '#FFF7ED',
    accent: '#FB923C',
  },
  {
    id: 'noir',
    name: 'Noir Brutalist',
    emoji: '🖤',
    primaryColor: '#FFFFFF',
    background: '#181416',
    surface: '#262024',
    surface2: '#342C31',
    accent: '#FFCAD4',
  }
];

// Helper to convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

// Generate matching theme colors from any custom hex color
export function generateThemeFromHex(hex: string): {
  background: string;
  surface: string;
  surface2: string;
  accent: string;
  primary: string;
} {
  try {
    const { h, s, l } = hexToHSL(hex);
    
    // Check if it's very dark
    if (l < 25) {
      return {
        background: '#181416',
        surface: '#262024',
        surface2: '#342C31',
        accent: hex,
        primary: hex,
      };
    }

    // Generate pastel background, surface, and surface2
    const bgS = Math.min(s, 75);
    const background = hslToHex(h, bgS, 85);
    const surface = hslToHex(h, Math.max(bgS - 15, 20), 92);
    const surface2 = hslToHex(h, Math.max(bgS - 25, 10), 97);
    const accent = hslToHex(h, Math.min(s + 15, 90), 65);

    return {
      background,
      surface,
      surface2,
      accent,
      primary: hex,
    };
  } catch {
    return {
      background: '#FFCAD4',
      surface: '#FFE5EC',
      surface2: '#FFF0F3',
      accent: '#FF85A1',
      primary: hex,
    };
  }
}
