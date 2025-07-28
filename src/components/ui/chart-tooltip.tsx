import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
    color?: string;
  }>;
  label?: string;
  formatter?: (value: number | string, name: string) => string;
  className?: string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
  className
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <Card className={cn("p-3 shadow-lg backdrop-blur-sm border border-border/50", className)}>
      {label && (
        <p className="font-semibold text-primary text-sm mb-2">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              {entry.color && (
                <div 
                  className="w-3 h-3 rounded-full border border-white/20" 
                  style={{ backgroundColor: entry.color }}
                />
              )}
              <span className="text-muted-foreground font-medium">{entry.name}:</span>
            </div>
            <span className="font-mono font-semibold">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Helper formatting functions
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatVolume = (value: number): string => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(2);
};