import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceTickerProps {
  price: number;
  change: number;
  changePercent: number;
  symbol: string;
  className?: string;
}

export const PriceTicker: React.FC<PriceTickerProps> = ({
  price,
  change,
  changePercent,
  symbol,
  className
}) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const [lastPrice, setLastPrice] = useState(price);

  useEffect(() => {
    if (price !== lastPrice) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 300);
      setLastPrice(price);
      return () => clearTimeout(timer);
    }
  }, [price, lastPrice]);

  const isPositive = change >= 0;

  return (
    <div className={cn(
      "flex items-center space-x-4 p-4 rounded-lg border transition-all duration-300",
      isFlashing && (isPositive ? "bg-performance-positive/10" : "bg-performance-negative/10"),
      "hover:shadow-lg hover:scale-[1.02]",
      className
    )}>
      {/* Symbol */}
      <div className="text-sm font-medium text-muted-foreground">
        {symbol}
      </div>
      
      {/* Price */}
      <div className={cn(
        "text-xl font-bold transition-colors duration-300",
        isFlashing && (isPositive ? "text-performance-positive" : "text-performance-negative")
      )}>
        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      
      {/* Change */}
      <div className={cn(
        "flex items-center space-x-1 text-sm font-medium",
        isPositive ? "text-performance-positive" : "text-performance-negative"
      )}>
        {isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <span>
          {isPositive ? '+' : ''}{change.toFixed(2)}
        </span>
        <span className="text-xs">
          ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
};