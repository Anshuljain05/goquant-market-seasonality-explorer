import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MonthlyData {
  month: Date;
  volatilityTrend: 'increasing' | 'decreasing' | 'stable';
  avgVolatility: number;
  totalVolume: number;
  monthlyPerformance: number;
  liquidityPattern: 'high' | 'medium' | 'low';
  avgLiquidity: number;
  monthHigh: number;
  monthLow: number;
  tradingDays: number;
  bestWeek: { start: Date; performance: number };
  worstWeek: { start: Date; performance: number };
}

const generateMonthlyData = (month: Date): MonthlyData => {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  // Aggregate mock data for the month
  let totalVolatility = 0;
  let totalVolume = 0;
  let totalLiquidity = 0;
  let prices: number[] = [];
  let weeklyPerformances: { start: Date; performance: number }[] = [];
  let tradingDays = 0;
  let volatilities: number[] = [];
  
  // Generate weekly data for the month
  const current = new Date(monthStart);
  while (current <= monthEnd) {
    const weekStart = new Date(current);
    weekStart.setDate(current.getDate() - current.getDay());
    
    let weekVolatility = 0;
    let weekVolume = 0;
    let weekLiquidity = 0;
    let weekPerformance = 0;
    let weekTradingDays = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      if (date >= monthStart && date <= monthEnd && date.getDay() !== 0 && date.getDay() !== 6) {
        const seed = date.getTime();
        const random = (min: number, max: number) => {
          const x = Math.sin(seed * 9.301) * 10000;
          return min + (x - Math.floor(x)) * (max - min);
        };
        
        const volatility = random(0, 1);
        weekVolatility += volatility;
        weekVolume += random(1000000, 100000000);
        weekLiquidity += random(0.1, 1);
        weekPerformance += random(-0.03, 0.03);
        prices.push(random(40000, 70000));
        volatilities.push(volatility);
        weekTradingDays++;
        tradingDays++;
      }
    }
    
    if (weekTradingDays > 0) {
      totalVolatility += weekVolatility;
      totalVolume += weekVolume;
      totalLiquidity += weekLiquidity;
      weeklyPerformances.push({
        start: new Date(weekStart),
        performance: weekPerformance / weekTradingDays
      });
    }
    
    current.setDate(current.getDate() + 7);
  }
  
  const avgVolatility = totalVolatility / tradingDays;
  const avgLiquidity = totalLiquidity / tradingDays;
  const monthlyPerformance = weeklyPerformances.reduce((sum, week) => sum + week.performance, 0);
  
  // Determine volatility trend
  const firstHalfVolatility = volatilities.slice(0, Math.floor(volatilities.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(volatilities.length / 2);
  const secondHalfVolatility = volatilities.slice(Math.floor(volatilities.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(volatilities.length / 2);
  const volatilityTrend = secondHalfVolatility > firstHalfVolatility * 1.1 ? 'increasing' : 
                          secondHalfVolatility < firstHalfVolatility * 0.9 ? 'decreasing' : 'stable';
  
  // Determine liquidity pattern
  const liquidityPattern = avgLiquidity > 0.7 ? 'high' : avgLiquidity > 0.4 ? 'medium' : 'low';
  
  // Find best and worst weeks
  const bestWeek = weeklyPerformances.reduce((best, current) => 
    current.performance > best.performance ? current : best
  );
  const worstWeek = weeklyPerformances.reduce((worst, current) => 
    current.performance < worst.performance ? current : worst
  );
  
  return {
    month,
    volatilityTrend,
    avgVolatility,
    totalVolume,
    monthlyPerformance,
    liquidityPattern,
    avgLiquidity,
    monthHigh: Math.max(...prices),
    monthLow: Math.min(...prices),
    tradingDays,
    bestWeek,
    worstWeek,
  };
};

interface MonthlyViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDateSelect?: (date: Date) => void;
  selectedForDashboard?: Date | null;
  onHover?: (data: any) => void;
  onHoverLeave?: () => void;
  filters?: any;
  dateRange?: any;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({
  selectedDate,
  onDateChange,
  onDateSelect,
  selectedForDashboard,
  onHover,
  onHoverLeave,
  filters,
  dateRange
}) => {
  const monthlyData = useMemo(() => generateMonthlyData(selectedDate), [selectedDate]);
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    onDateChange(newDate);
  };

  const getVolatilityTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-volatility-high';
      case 'decreasing': return 'text-volatility-low';
      default: return 'text-volatility-medium';
    }
  };

  const getLiquidityPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'high': return 'text-performance-positive';
      case 'medium': return 'text-performance-neutral';
      default: return 'text-performance-negative';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance > 0) return 'text-performance-positive';
    if (performance < 0) return 'text-performance-negative';
    return 'text-performance-neutral';
  };

  const isSelected = selectedForDashboard && 
    selectedForDashboard.getMonth() === selectedDate.getMonth() &&
    selectedForDashboard.getFullYear() === selectedDate.getFullYear();

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
        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className="flex-shrink-0">
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>
        <h2 className="text-lg sm:text-xl font-semibold text-center px-2">
          <span className="hidden sm:inline">
            {selectedDate.toLocaleDateString('en-US', { 
              month: 'long',
              year: 'numeric'
            })}
          </span>
          <span className="sm:hidden">
            {selectedDate.toLocaleDateString('en-US', { 
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </h2>
        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className="flex-shrink-0">
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Monthly Overview Card */}
      <Card 
        className={cn(
          "p-3 sm:p-4 lg:p-6 cursor-pointer transition-all duration-200 hover:shadow-lg touch-manipulation focus:outline-none focus:ring-2 focus:ring-secondary",
          isSelected && "ring-2 ring-accent scale-105",
          dateRange?.start && dateRange?.end && 
          selectedDate >= dateRange.start && selectedDate <= dateRange.end &&
          "ring-2 ring-primary/50 bg-primary/5"
        )}
        tabIndex={0}
        onClick={() => onDateSelect?.(selectedDate)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDateSelect?.(selectedDate);
          }
        }}
        onMouseEnter={() => onHover?.({ 
          date: selectedDate, 
          volatility: monthlyData.avgVolatility,
          performance: monthlyData.monthlyPerformance,
          volume: monthlyData.totalVolume,
          price: (monthlyData.monthHigh + monthlyData.monthLow) / 2,
          liquidity: monthlyData.avgLiquidity
        })}
        onMouseLeave={() => onHoverLeave?.()}
        onTouchStart={() => onHover?.({ 
          date: selectedDate, 
          volatility: monthlyData.avgVolatility,
          performance: monthlyData.monthlyPerformance,
          volume: monthlyData.totalVolume,
          price: (monthlyData.monthHigh + monthlyData.monthLow) / 2,
          liquidity: monthlyData.avgLiquidity
        })}
        onTouchEnd={() => onHoverLeave?.()}
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Header with Performance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold truncate">Monthly Overview</h3>
              <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                {monthlyData.monthlyPerformance > 0.05 ? (
                  <TrendingUp className="w-full h-full text-performance-positive" />
                ) : monthlyData.monthlyPerformance < -0.05 ? (
                  <TrendingDown className="w-full h-full text-performance-negative" />
                ) : (
                  <BarChart3 className="w-full h-full text-performance-neutral" />
                )}
              </div>
            </div>
            <div className={cn("text-base sm:text-lg font-bold flex-shrink-0", getPerformanceColor(monthlyData.monthlyPerformance))}>
              {(monthlyData.monthlyPerformance * 100).toFixed(2)}%
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 rounded-lg border-2 border-volatility-medium/20 bg-volatility-medium/5">
              <p className="text-sm font-medium mb-1">Volatility Trend</p>
              <p className={cn("text-xl font-bold capitalize", getVolatilityTrendColor(monthlyData.volatilityTrend))}>
                {monthlyData.volatilityTrend}
              </p>
              <p className="text-xs text-muted-foreground">
                Avg: {(monthlyData.avgVolatility * 100).toFixed(1)}%
              </p>
            </div>
            
            <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <p className="text-sm font-medium mb-1">Liquidity Pattern</p>
              <p className={cn("text-xl font-bold capitalize", getLiquidityPatternColor(monthlyData.liquidityPattern))}>
                {monthlyData.liquidityPattern}
              </p>
              <p className="text-xs text-muted-foreground">
                Avg: {(monthlyData.avgLiquidity * 100).toFixed(0)}%
              </p>
            </div>

            <div className="p-4 rounded-lg border-2 border-accent/20 bg-accent/5">
              <p className="text-sm font-medium mb-1">Monthly Performance</p>
              <p className={cn("text-xl font-bold", getPerformanceColor(monthlyData.monthlyPerformance))}>
                {monthlyData.monthlyPerformance > 0 ? '+' : ''}{(monthlyData.monthlyPerformance * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Over {monthlyData.tradingDays} trading days
              </p>
            </div>
          </div>

          {/* Price Range and Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Month High</p>
              <p className="text-lg font-semibold text-performance-positive">
                ${monthlyData.monthHigh.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Month Low</p>
              <p className="text-lg font-semibold text-performance-negative">
                ${monthlyData.monthLow.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Total Volume</p>
              <p className="text-lg font-semibold">
                ${(monthlyData.totalVolume / 1000000).toFixed(0)}M
              </p>
            </div>
          </div>

          {/* Best and Worst Weeks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 rounded-lg bg-performance-positive/10 border border-performance-positive/20">
              <p className="text-sm font-medium text-performance-positive mb-1">Best Week</p>
              <p className="text-sm text-muted-foreground">
                {monthlyData.bestWeek.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-lg font-bold text-performance-positive">
                +{(monthlyData.bestWeek.performance * 100).toFixed(2)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-performance-negative/10 border border-performance-negative/20">
              <p className="text-sm font-medium text-performance-negative mb-1">Worst Week</p>
              <p className="text-sm text-muted-foreground">
                {monthlyData.worstWeek.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-lg font-bold text-performance-negative">
                {(monthlyData.worstWeek.performance * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};