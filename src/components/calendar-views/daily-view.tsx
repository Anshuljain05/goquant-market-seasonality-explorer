import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DailyData {
  date: Date;
  volatility: number;
  performance: number;
  volume: number;
  price: number;
  liquidity: number;
  intradayHigh: number;
  intradayLow: number;
  openPrice: number;
  closePrice: number;
}

const generateDailyData = (date: Date): DailyData => {
  const seed = date.getTime();
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * 9.301) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };
  
  const basePrice = random(40000, 70000);
  const volatility = random(0, 1);
  const performance = random(-0.15, 0.15);
  
  return {
    date,
    volatility,
    performance,
    volume: random(1000000, 100000000),
    price: basePrice,
    liquidity: random(0.1, 1),
    intradayHigh: basePrice * (1 + random(0, 0.05)),
    intradayLow: basePrice * (1 - random(0, 0.05)),
    openPrice: basePrice * (1 + random(-0.02, 0.02)),
    closePrice: basePrice * (1 + performance),
  };
};

interface DailyViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDateSelect?: (date: Date) => void;
  selectedForDashboard?: Date | null;
  onHover?: (data: any) => void;
  onHoverLeave?: () => void;
  filters?: any;
  dateRange?: any;
}

export const DailyView: React.FC<DailyViewProps> = ({
  selectedDate,
  onDateChange,
  onDateSelect,
  selectedForDashboard,
  onHover,
  onHoverLeave,
  filters,
  dateRange
}) => {
  const dailyData = useMemo(() => generateDailyData(selectedDate), [selectedDate]);
  
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    onDateChange(newDate);
  };

  const getVolatilityColor = (volatility: number) => {
    if (volatility < 0.3) return 'text-volatility-low border-volatility-low bg-volatility-low/10';
    if (volatility < 0.7) return 'text-volatility-medium border-volatility-medium bg-volatility-medium/10';
    return 'text-volatility-high border-volatility-high bg-volatility-high/10';
  };

  const getPerformanceColor = (performance: number) => {
    if (performance > 0) return 'text-performance-positive';
    if (performance < 0) return 'text-performance-negative';
    return 'text-performance-neutral';
  };

  const isSelected = selectedForDashboard?.toDateString() === selectedDate.toDateString();
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateDay('prev')}>
          <ChevronLeft className="w-4 h-4" />
          Previous Day
        </Button>
        <h2 className={cn(
          "text-xl font-semibold",
          isToday(selectedDate) && "text-primary animate-pulse-glow"
        )}>
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          {isToday(selectedDate) && (
            <span className="ml-2 text-sm bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/30 animate-pulse-glow">
              TODAY
            </span>
          )}
        </h2>
        <Button variant="outline" size="sm" onClick={() => navigateDay('next')}>
          Next Day
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Daily Metrics Card */}
      <Card 
        className={cn(
          "p-6 cursor-pointer transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary",
          isSelected && "ring-2 ring-accent scale-105",
          isToday(selectedDate) && "ring-4 ring-primary shadow-glow animate-pulse-glow",
          dateRange?.start && dateRange?.end && 
          selectedDate >= dateRange.start && selectedDate <= dateRange.end &&
          "ring-2 ring-primary/50 bg-primary/5"
        )}
        tabIndex={0}
        onClick={() => onDateSelect?.(selectedDate)}
        onMouseEnter={() => onHover?.({ date: selectedDate, ...dailyData })}
        onMouseLeave={() => onHoverLeave?.()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDateSelect?.(selectedDate);
          }
        }}
      >
        <div className="space-y-4">
          {/* Header with Performance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold">Daily Overview</h3>
              {dailyData.performance > 0.02 ? (
                <TrendingUp className="w-5 h-5 text-performance-positive" />
              ) : dailyData.performance < -0.02 ? (
                <TrendingDown className="w-5 h-5 text-performance-negative" />
              ) : (
                <BarChart3 className="w-5 h-5 text-performance-neutral" />
              )}
            </div>
            <div className={cn("text-lg font-bold", getPerformanceColor(dailyData.performance))}>
              {(dailyData.performance * 100).toFixed(2)}%
            </div>
          </div>

          {/* Price Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="font-semibold">${dailyData.openPrice.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Close</p>
              <p className="font-semibold">${dailyData.closePrice.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">High</p>
              <p className="font-semibold text-performance-positive">
                ${dailyData.intradayHigh.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Low</p>
              <p className="font-semibold text-performance-negative">
                ${dailyData.intradayLow.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Volatility and Volume */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={cn("p-4 rounded-lg border-2", getVolatilityColor(dailyData.volatility))}>
              <p className="text-sm font-medium mb-1">Intraday Volatility</p>
              <p className="text-2xl font-bold">{(dailyData.volatility * 100).toFixed(1)}%</p>
              <p className="text-xs opacity-75">
                Range: ${(dailyData.intradayHigh - dailyData.intradayLow).toLocaleString()}
              </p>
            </div>
            
            <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <p className="text-sm font-medium mb-1">Trading Volume</p>
              <p className="text-2xl font-bold">${(dailyData.volume / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">
                Liquidity: {(dailyData.liquidity * 100).toFixed(0)}%
              </p>
            </div>

            <div className="p-4 rounded-lg border-2 border-accent/20 bg-accent/5">
              <p className="text-sm font-medium mb-1">Price Change</p>
              <p className={cn("text-2xl font-bold", getPerformanceColor(dailyData.performance))}>
                ${Math.abs(dailyData.closePrice - dailyData.openPrice).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {dailyData.performance > 0 ? 'Gain' : dailyData.performance < 0 ? 'Loss' : 'Neutral'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};