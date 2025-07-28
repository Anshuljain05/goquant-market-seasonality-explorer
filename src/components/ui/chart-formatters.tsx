import React from 'react';

// Currency formatting
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: value >= 1 ? 2 : 6,
    maximumFractionDigits: value >= 1 ? 2 : 6
  }).format(value);
};

// Price formatting with smart precision
export const formatPrice = (value: number): string => {
  if (value >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } else if (value >= 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 8
    }).format(value);
  }
};

// Volume formatting
export const formatVolume = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(0);
};

// Percentage formatting
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

// Time formatting for different scales
export const formatTime = (timestamp: number, scale: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day'): string => {
  const date = new Date(timestamp);
  
  switch (scale) {
    case 'minute':
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    case 'hour':
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    case 'day':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit' 
      });
    case 'week':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit' 
      });
    case 'month':
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    default:
      return date.toLocaleDateString();
  }
};

// Smart tick generation for price axis
export const generatePriceTicks = (min: number, max: number, targetTicks: number = 8): number[] => {
  const range = max - min;
  const roughStep = range / targetTicks;
  
  // Round to nice numbers
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;
  
  let niceStep: number;
  if (normalizedStep <= 1) niceStep = 1;
  else if (normalizedStep <= 2) niceStep = 2;
  else if (normalizedStep <= 5) niceStep = 5;
  else niceStep = 10;
  
  const step = niceStep * magnitude;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  
  const ticks: number[] = [];
  for (let tick = niceMin; tick <= niceMax; tick += step) {
    ticks.push(Number(tick.toFixed(10))); // Avoid floating point errors
  }
  
  return ticks;
};

// Custom axis formatters for recharts
export const PriceAxisFormatter = (value: number): string => formatPrice(value);
export const VolumeAxisFormatter = (value: number): string => formatVolume(value);
export const PercentageAxisFormatter = (value: number): string => formatPercentage(value);
export const TimeAxisFormatter = (value: number): string => formatTime(value);

// Chart grid component
interface ChartGridProps {
  stroke?: string;
  strokeDasharray?: string;
  opacity?: number;
}

export const ChartGrid: React.FC<ChartGridProps> = ({
  stroke = 'hsl(var(--border))',
  strokeDasharray = '2 2',
  opacity = 0.3
}) => (
  <defs>
    <pattern
      id="chart-grid"
      width="1"
      height="1"
      patternUnits="userSpaceOnUse"
    >
      <path
        d="M 1 0 L 0 0 0 1"
        fill="none"
        stroke={stroke}
        strokeDasharray={strokeDasharray}
        opacity={opacity}
      />
    </pattern>
  </defs>
);

// Professional color schemes
export const chartColors = {
  bullish: 'hsl(var(--success))',
  bearish: 'hsl(var(--destructive))',
  neutral: 'hsl(var(--muted-foreground))',
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  grid: 'hsl(var(--border))',
  background: 'hsl(var(--background))',
  surface: 'hsl(var(--card))',
  text: 'hsl(var(--foreground))',
  textSecondary: 'hsl(var(--muted-foreground))'
};

// Technical indicator colors
export const indicatorColors = {
  rsi: '#8884d8',
  macd: '#82ca9d',
  signal: '#ffc658',
  histogram: '#ff7300',
  sma: '#8dd1e1',
  ema: '#d084d0',
  bollinger: {
    upper: '#ff9999',
    middle: '#ffcc99',
    lower: '#99ccff'
  },
  support: '#90EE90',
  resistance: '#FFB6C1'
};