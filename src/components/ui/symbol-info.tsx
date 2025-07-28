import React from 'react';
import { Clock, Globe, TrendingUp, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SymbolInfoProps {
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
  className?: string;
}

export const SymbolInfo: React.FC<SymbolInfoProps> = ({
  symbol,
  price,
  change,
  changePercent,
  volume,
  marketCap,
  high24h,
  low24h,
  className
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const isPositive = changePercent ? changePercent > 0 : false;
  const marketStatus = 'OPEN'; // In a real app, this would come from the API
  const lastUpdate = new Date().toLocaleTimeString();

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            {symbol}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={marketStatus === 'OPEN' ? 'default' : 'secondary'} className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              {marketStatus}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {lastUpdate}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Price Information */}
          {price && (
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold font-mono">
                  {formatCurrency(price)}
                </span>
                {changePercent && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
                    isPositive ? "bg-performance-positive/20 text-performance-positive" : "bg-performance-negative/20 text-performance-negative"
                  )}>
                    <TrendingUp className={cn("w-3 h-3", !isPositive && "rotate-180")} />
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                  </div>
                )}
              </div>
              {change && (
                <p className={cn(
                  "text-sm font-medium",
                  isPositive ? "text-performance-positive" : "text-performance-negative"
                )}>
                  {isPositive ? '+' : ''}{formatCurrency(change)} today
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Market Statistics */}
          <div className="grid grid-cols-2 gap-4">
            {high24h && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  24h High
                </p>
                <p className="font-mono text-sm font-medium text-chart-2">
                  {formatCurrency(high24h)}
                </p>
              </div>
            )}
            {low24h && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 rotate-180" />
                  24h Low
                </p>
                <p className="font-mono text-sm font-medium text-chart-3">
                  {formatCurrency(low24h)}
                </p>
              </div>
            )}
            {volume && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  24h Volume
                </p>
                <p className="font-mono text-sm font-medium text-chart-4">
                  {formatVolume(volume)}
                </p>
              </div>
            )}
            {marketCap && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Market Cap
                </p>
                <p className="font-mono text-sm font-medium text-chart-5">
                  {formatVolume(marketCap)}
                </p>
              </div>
            )}
          </div>

          {/* Price Range Visualization */}
          {high24h && low24h && price && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">24h Range</p>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-chart-3 to-chart-2 rounded-full"
                  style={{ width: '100%' }}
                />
                <div 
                  className="absolute top-0 w-2 h-full bg-primary rounded-full shadow-lg"
                  style={{ 
                    left: `${((price - low24h) / (high24h - low24h)) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(low24h)}</span>
                <span>{formatCurrency(high24h)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};