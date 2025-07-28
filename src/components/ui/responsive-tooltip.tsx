import React, { useState, useEffect } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';

interface ResponsiveTooltipProps {
  children: React.ReactNode;
  data: any;
  position: { x: number; y: number };
  visible: boolean;
  className?: string;
}

export const ResponsiveTooltip: React.FC<ResponsiveTooltipProps> = ({
  children,
  data,
  position,
  visible,
  className
}) => {
  const { isMobile, screenSize } = useBreakpoint();
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (!visible || !data) return;

    const tooltipWidth = isMobile ? 280 : 320;
    const tooltipHeight = isMobile ? 200 : 180;
    const margin = 16;

    let { x, y } = position;

    // Adjust horizontal position
    if (x + tooltipWidth + margin > screenSize.width) {
      x = screenSize.width - tooltipWidth - margin;
    }
    if (x < margin) {
      x = margin;
    }

    // Adjust vertical position
    if (y + tooltipHeight + margin > screenSize.height) {
      y = y - tooltipHeight - margin;
    }
    if (y < margin) {
      y = margin;
    }

    setAdjustedPosition({ x, y });
  }, [position, visible, data, isMobile, screenSize]);

  if (!visible || !data) return null;

  const formatValue = (value: number, type: 'currency' | 'percentage' | 'volume') => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
      case 'volume':
        return new Intl.NumberFormat('en-US', {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(value);
      default:
        return value.toString();
    }
  };

  return (
    <>
      {/* Mobile: Bottom sheet style */}
      {isMobile ? (
        <div
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out',
            visible ? 'translate-y-0' : 'translate-y-full',
            className
          )}
        >
          <div className="bg-popover border-t border-border rounded-t-2xl shadow-lg p-4 mx-2 mb-2">
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="font-semibold text-lg">
                  {data.date?.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-sm text-muted-foreground">Price</div>
                    <div className="font-bold text-lg">{formatValue(data.price, 'currency')}</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-sm text-muted-foreground">Performance</div>
                    <div className={cn(
                      'font-bold text-lg',
                      data.performance > 0 ? 'text-performance-positive' : 'text-performance-negative'
                    )}>
                      {formatValue(data.performance, 'percentage')}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-sm text-muted-foreground">Volume</div>
                    <div className="font-bold text-lg">{formatValue(data.volume, 'volume')}</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-sm text-muted-foreground">Volatility</div>
                    <div className="font-bold text-lg">{formatValue(data.volatility, 'percentage')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop: Floating tooltip */
        <div
          className={cn(
            'fixed z-50 pointer-events-none transition-opacity duration-200',
            visible ? 'opacity-100' : 'opacity-0',
            className
          )}
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
        >
          <div className="bg-popover border border-border rounded-lg shadow-lg p-4 max-w-sm">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  {data.date?.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Price</div>
                  <div className="font-semibold">{formatValue(data.price, 'currency')}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Performance</div>
                  <div className={cn(
                    'font-semibold',
                    data.performance > 0 ? 'text-performance-positive' : 'text-performance-negative'
                  )}>
                    {formatValue(data.performance, 'percentage')}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Volume</div>
                  <div className="font-semibold">{formatValue(data.volume, 'volume')}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Volatility</div>
                  <div className="font-semibold">{formatValue(data.volatility, 'percentage')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};