"use client";

import { useEffect } from "react";
import { useAgentStore } from "@/store/agentStore";
import { generateThemeFromHex, THEME_PRESETS } from "@/lib/theme";
import { setBrowserFavicon } from "@/lib/imageUtils";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, initialize } = useAgentStore();
  const theme = settings.theme;
  const primaryColor = settings.primaryColor;

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--background', '#181416');
      root.style.setProperty('--surface', '#262024');
      root.style.setProperty('--surface-2', '#342C31');
      root.style.setProperty('--card', '#262024');
      root.style.setProperty('--card-foreground', '#FFCAD4');
      root.style.setProperty('--border', '#FFCAD4');
      root.style.setProperty('--foreground', '#FFCAD4');
      root.style.setProperty('--primary', (primaryColor && primaryColor !== '#000000') ? primaryColor : '#FFCAD4');
      root.style.setProperty('--primary-foreground', '#000000');
      root.style.setProperty('--secondary', '#342C31');
      root.style.setProperty('--secondary-foreground', '#FFCAD4');
      root.style.setProperty('--text-muted', '#FFB3BA');
      root.style.setProperty('--accent', '#FF85A1');
    } else {
      root.classList.remove('dark');
      
      // Check if primaryColor matches any preset
      const preset = THEME_PRESETS.find(p => p.primaryColor === primaryColor || p.background.toLowerCase() === primaryColor?.toLowerCase() || p.accent.toLowerCase() === primaryColor?.toLowerCase());
      
      if (preset && preset.id !== 'noir') {
        root.style.setProperty('--background', preset.background);
        root.style.setProperty('--surface', preset.surface);
        root.style.setProperty('--surface-2', preset.surface2);
        root.style.setProperty('--card', '#FFFFFF');
        root.style.setProperty('--card-foreground', '#000000');
        root.style.setProperty('--border', '#000000');
        root.style.setProperty('--foreground', '#000000');
        root.style.setProperty('--primary', preset.primaryColor);
        root.style.setProperty('--primary-foreground', '#FFFFFF');
        root.style.setProperty('--secondary', '#FFFFFF');
        root.style.setProperty('--secondary-foreground', '#000000');
        root.style.setProperty('--text-muted', '#333333');
        root.style.setProperty('--accent', preset.accent);
      } else if (primaryColor && primaryColor !== '#000000') {
        const custom = generateThemeFromHex(primaryColor);
        root.style.setProperty('--background', custom.background);
        root.style.setProperty('--surface', custom.surface);
        root.style.setProperty('--surface-2', custom.surface2);
        root.style.setProperty('--card', '#FFFFFF');
        root.style.setProperty('--card-foreground', '#000000');
        root.style.setProperty('--border', '#000000');
        root.style.setProperty('--foreground', '#000000');
        root.style.setProperty('--primary', custom.primary);
        root.style.setProperty('--primary-foreground', '#FFFFFF');
        root.style.setProperty('--secondary', '#FFFFFF');
        root.style.setProperty('--secondary-foreground', '#000000');
        root.style.setProperty('--text-muted', '#333333');
        root.style.setProperty('--accent', custom.accent);
      } else {
        // Default Brutalist Salmon Pink
        root.style.setProperty('--background', '#FFCAD4');
        root.style.setProperty('--surface', '#FFE5EC');
        root.style.setProperty('--surface-2', '#FFF0F3');
        root.style.setProperty('--card', '#FFFFFF');
        root.style.setProperty('--card-foreground', '#000000');
        root.style.setProperty('--border', '#000000');
        root.style.setProperty('--foreground', '#000000');
        root.style.setProperty('--primary', '#000000');
        root.style.setProperty('--primary-foreground', '#FFFFFF');
        root.style.setProperty('--secondary', '#FFFFFF');
        root.style.setProperty('--secondary-foreground', '#000000');
        root.style.setProperty('--text-muted', '#333333');
        root.style.setProperty('--accent', '#FF85A1');
      }
    }
  }, [theme, primaryColor]);

  // Dynamic Favicon Update from Custom Logo
  useEffect(() => {
    setBrowserFavicon("/logo_star.jpg");
  }, []);

  return <>{children}</>;
}
