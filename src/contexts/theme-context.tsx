import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ColorScheme = 'default' | 'high-contrast' | 'colorblind-friendly' | 'light';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultScheme?: ColorScheme;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultScheme = 'default',
  storageKey = 'financial-calendar-theme',
}) => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultScheme);
  const [isDark, setIsDark] = useState(true);

  // Load theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const { colorScheme: storedScheme, isDark: storedIsDark } = JSON.parse(stored);
        setColorScheme(storedScheme || defaultScheme);
        setIsDark(storedIsDark !== undefined ? storedIsDark : true);
      } catch {
        // Invalid stored data, use defaults
      }
    }
  }, [defaultScheme, storageKey]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('default', 'high-contrast', 'colorblind-friendly', 'light', 'dark');
    
    // Apply color scheme class
    root.classList.add(colorScheme);
    
    // Apply dark/light mode
    if (isDark && colorScheme !== 'light') {
      root.classList.add('dark');
    }

    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify({ colorScheme, isDark }));
  }, [colorScheme, isDark, storageKey]);

  const handleSetColorScheme = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    // Light scheme forces light mode
    if (scheme === 'light') {
      setIsDark(false);
    }
  };

  const toggleDarkMode = () => {
    // Can't toggle dark mode for light scheme
    if (colorScheme === 'light') return;
    setIsDark(!isDark);
  };

  const value: ThemeContextType = {
    colorScheme,
    setColorScheme: handleSetColorScheme,
    isDark,
    toggleDarkMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};