import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WeeklyData {
  weekStart: Date;
  weekEnd: Date;
  avgVolatility: number;
  totalVolume: number;
  weeklyPerformance: number;
  avgLiquidity: number;
  highestPrice: number;
  lowestPrice: number;
  tradingDays: number;
}

const generateWeeklyData = (weekStart: Date): WeeklyData => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  // Aggregate mock data for the week
  let totalVolatility = 0;
  let totalVolume = 0;
  let totalLiquidity = 0;
  let prices: number[] = [];
  let performances: number[] = [];
  let tradingDays = 0;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    
    // Skip weekends for trading data
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      const seed = date.getTime();
      const random = (min: number, max: number) => {
        const x = Math.sin(seed * 9.301) * 10000;
        return min + (x - Math.floor(x)) * (max - min);
      };
      
      totalVolatility += random(0, 1);
      totalVolume += random(1000000, 100000000);
      totalLiquidity += random(0.1, 1);
      prices.push(random(40000, 70000));
      performances.push(random(-0.15, 0.15));
      tradingDays++;
    }
  }
  
  const avgVolatility = totalVolatility / tradingDays;
  const avgLiquidity = totalLiquidity / tradingDays;
  const weeklyPerformance = performances.reduce((sum, perf) => sum + perf, 0);
  
  return {
    weekStart,
    weekEnd,
    avgVolatility,
    totalVolume,
    weeklyPerformance,
    avgLiquidity,
    highestPrice: Math.max(...prices),
    lowestPrice: Math.min(...prices),
    tradingDays,
  };
};

interface WeeklyViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDateSelect?: (date: Date) => void;
  selectedForDashboard?: Date | null;
  onHover?: (data: any) => void;
  onHoverLeave?: () => void;
  filters?: any;
  dateRange?: any;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  selectedDate,
  onDateChange,
  onDateSelect,
  selectedForDashboard,
  onHover,
  onHoverLeave,
  filters,
  dateRange
}) => {
  const weekStart = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    return start;
  }, [selectedDate]);
  
  const weeklyData = useMemo(() => generateWeeklyData(weekStart), [weekStart]);
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
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

  const isSelected = selectedForDashboard && 
    selectedForDashboard >= weekStart && 
    selectedForDashboard <= weeklyData.weekEnd;

  return (
    <div className="space-y-6" onMouseMove={(e) => {
      // Update mouse position for tooltip positioning
      const rect = e.currentTarget.getBoundingClientRect();
      const event = new MouseEvent('mousemove', {
        clientX: e.clientX,
        clientY: e.clientY
      });
      window.dispatchEvent(event);
    }}>
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
          <ChevronLeft className="w-4 h-4" />
          Previous Week
        </Button>
        <h2 className="text-xl font-semibold">
          {weekStart.toLocaleDateString('en-US', { 
            month: 'short',
            day: 'numeric'
          })} - {weeklyData.weekEnd.toLocaleDateString('en-US', { 
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </h2>
        <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
          Next Week
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Weekly Summary Card */}
      <Card 
        className={cn(
          "p-6 cursor-pointer transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary",
          isSelected && "ring-2 ring-accent scale-105",
          dateRange?.start && dateRange?.end && 
          weekStart >= dateRange.start && weeklyData.weekEnd <= dateRange.end &&
          "ring-2 ring-primary/50 bg-primary/5"
        )}
        tabIndex={0}
        onClick={() => onDateSelect?.(weekStart)}
        onMouseEnter={() => onHover?.({ 
          date: weekStart, 
          volatility: weeklyData.avgVolatility,
          performance: weeklyData.weeklyPerformance,
          volume: weeklyData.totalVolume,
          price: (weeklyData.highestPrice + weeklyData.lowestPrice) / 2,
          liquidity: weeklyData.avgLiquidity
        })}
        onMouseLeave={() => onHoverLeave?.()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDateSelect?.(weekStart);
          }
        }}
      >
        <div className="space-y-4">
          {/* Header with Performance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold">Weekly Summary</h3>
              {weeklyData.weeklyPerformance > 0.02 ? (
                <TrendingUp className="w-5 h-5 text-performance-positive" />
              ) : weeklyData.weeklyPerformance < -0.02 ? (
                <TrendingDown className="w-5 h-5 text-performance-negative" />
              ) : (
                <BarChart3 className="w-5 h-5 text-performance-neutral" />
              )}
            </div>
            <div className={cn("text-lg font-bold", getPerformanceColor(weeklyData.weeklyPerformance))}>
              {(weeklyData.weeklyPerformance * 100).toFixed(2)}%
            </div>
          </div>

          {/* Weekly Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={cn("p-4 rounded-lg border-2", getVolatilityColor(weeklyData.avgVolatility))}>
              <p className="text-sm font-medium mb-1">Average Volatility</p>
              <p className="text-2xl font-bold">{(weeklyData.avgVolatility * 100).toFixed(1)}%</p>
              <p className="text-xs opacity-75">
                Over {weeklyData.tradingDays} trading days
              </p>
            </div>
            
            <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <p className="text-sm font-medium mb-1">Total Volume</p>
              <p className="text-2xl font-bold">${(weeklyData.totalVolume / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">
                Avg Liquidity: {(weeklyData.avgLiquidity * 100).toFixed(0)}%
              </p>
            </div>

            <div className="p-4 rounded-lg border-2 border-accent/20 bg-accent/5">
              <p className="text-sm font-medium mb-1">Weekly Performance</p>
              <p className={cn("text-2xl font-bold", getPerformanceColor(weeklyData.weeklyPerformance))}>
                {weeklyData.weeklyPerformance > 0 ? '+' : ''}{(weeklyData.weeklyPerformance * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {weeklyData.weeklyPerformance > 0 ? 'Weekly Gain' : 
                 weeklyData.weeklyPerformance < 0 ? 'Weekly Loss' : 'No Change'}
              </p>
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Week High</p>
              <p className="font-semibold text-performance-positive">
                ${weeklyData.highestPrice.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Week Low</p>
              <p className="font-semibold text-performance-negative">
                ${weeklyData.lowestPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};