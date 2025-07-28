import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface LegendItem {
  color: string;
  label: string;
  value?: string | number;
  description?: string;
}

interface ChartLegendProps {
  title: string;
  items: LegendItem[];
  className?: string;
  compact?: boolean;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({
  title,
  items,
  className,
  compact = false
}) => {
  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5 text-xs">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium">{item.label}</span>
            {item.value && (
              <span className="text-muted-foreground">({item.value})</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.value && (
                  <Badge variant="secondary" className="text-xs">
                    {item.value}
                  </Badge>
                )}
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 pl-5">
                  {item.description}
                </p>
              )}
              {index < items.length - 1 && <Separator className="mt-2" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Predefined legend configurations for common chart types
export const ChartLegendConfigs = {
  candlestick: [
    {
      color: 'hsl(var(--chart-2))',
      label: 'Bullish Candle',
      description: 'Price closed higher than it opened'
    },
    {
      color: 'hsl(var(--chart-3))',
      label: 'Bearish Candle', 
      description: 'Price closed lower than it opened'
    },
    {
      color: 'hsl(var(--primary))',
      label: 'Trend Line',
      description: 'Overall price direction'
    },
    {
      color: 'hsl(var(--chart-4))',
      label: 'Volume',
      description: 'Trading volume for each period'
    }
  ],
  orderbook: [
    {
      color: 'hsl(var(--chart-2))',
      label: 'Bid Orders',
      description: 'Buy orders (buyers willing to purchase)'
    },
    {
      color: 'hsl(var(--chart-3))',
      label: 'Ask Orders',
      description: 'Sell orders (sellers willing to sell)'
    }
  ],
  depth: [
    {
      color: 'hsl(var(--chart-2))',
      label: 'Bid Depth',
      description: 'Cumulative buy orders by price level'
    },
    {
      color: 'hsl(var(--chart-3))',
      label: 'Ask Depth',
      description: 'Cumulative sell orders by price level'
    }
  ],
  volume: [
    {
      color: 'hsl(var(--chart-2))',
      label: 'Positive Volume',
      description: 'Volume when price increased'
    },
    {
      color: 'hsl(var(--chart-3))',
      label: 'Negative Volume',
      description: 'Volume when price decreased'
    }
  ]
};