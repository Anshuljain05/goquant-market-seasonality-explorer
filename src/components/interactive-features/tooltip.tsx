import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface TooltipData {
  date: Date;
  volatility: number;
  performance: number;
  volume: number;
  price: number;
  liquidity: number;
  [key: string]: any;
}

interface TooltipProps {
  data: TooltipData | null;
  position: { x: number; y: number };
  isVisible: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ data, position, isVisible }) => {
  if (!data || !isVisible) return null;

  const getPerformanceColor = (performance: number) => {
    if (performance > 0) return 'text-performance-positive';
    if (performance < 0) return 'text-performance-negative';
    return 'text-performance-neutral';
  };

  const getPerformanceIcon = (performance: number) => {
    if (performance > 0.02) return <TrendingUp className="w-4 h-4 text-performance-positive" />;
    if (performance < -0.02) return <TrendingDown className="w-4 h-4 text-performance-negative" />;
    return <BarChart3 className="w-4 h-4 text-performance-neutral" />;
  };

  return (
    <div 
      className="fixed z-50 bg-popover border border-border rounded-lg p-4 shadow-xl animate-fade-in max-w-xs pointer-events-none"
      style={{ 
        left: Math.min(position.x + 10, window.innerWidth - 300), 
        top: Math.max(position.y - 150, 10),
      }}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">
            {data.date?.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </h3>
          {getPerformanceIcon(data.performance)}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground">Performance</span>
            <div className={cn("font-medium", getPerformanceColor(data.performance))}>
              {data.performance > 0 ? '+' : ''}{(data.performance * 100).toFixed(2)}%
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-muted-foreground">Volatility</span>
            <div className="font-medium text-foreground">
              {(data.volatility * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-muted-foreground">Volume</span>
            <div className="font-medium text-foreground">
              ${(data.volume / 1000000).toFixed(1)}M
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-muted-foreground">Liquidity</span>
            <div className="font-medium text-foreground">
              {(data.liquidity * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        
        {data.price && (
          <div className="pt-2 border-t border-border">
            <span className="text-muted-foreground text-xs">Price: </span>
            <span className="font-medium text-foreground text-xs">
              ${data.price.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};