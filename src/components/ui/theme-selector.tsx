import React from 'react';
import { Check, Palette, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTheme, ColorScheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';

interface ThemeOption {
  value: ColorScheme;
  label: string;
  description: string;
  preview: string;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'default',
    label: 'Default',
    description: 'Classic financial dark theme',
    preview: 'bg-gradient-to-r from-chart-1 to-chart-2'
  },
  {
    value: 'high-contrast',
    label: 'High Contrast',
    description: 'Enhanced contrast for better visibility',
    preview: 'bg-gradient-to-r from-white to-black'
  },
  {
    value: 'colorblind-friendly',
    label: 'Colorblind Friendly',
    description: 'Accessible colors for all users',
    preview: 'bg-gradient-to-r from-blue-600 to-orange-500'
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Clean light theme for daylight use',
    preview: 'bg-gradient-to-r from-blue-50 to-blue-100'
  }
];

export const ThemeSelector: React.FC = () => {
  const { colorScheme, setColorScheme, isDark, toggleDarkMode } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      {/* Dark/Light Mode Toggle - disabled for light scheme */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDarkMode}
        disabled={colorScheme === 'light'}
        className="h-9 w-9 p-0"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Color Scheme Selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 px-3 gap-2"
            title="Change color scheme"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-foreground">Color Scheme</h4>
            <div className="grid gap-2">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  className={cn(
                    "h-auto p-3 justify-start text-left",
                    colorScheme === option.value && "bg-accent"
                  )}
                  onClick={() => setColorScheme(option.value)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div 
                      className={cn(
                        "w-6 h-6 rounded-full border-2 border-border flex-shrink-0",
                        option.preview
                      )} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{option.label}</span>
                        {colorScheme === option.value && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};