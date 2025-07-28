import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DailyView } from './calendar-views/daily-view';
import { WeeklyView } from './calendar-views/weekly-view';
import { MonthlyView } from './calendar-views/monthly-view';
import { FilterControls, FilterOptions } from './interactive-features/filter-controls';
import { DateRangeSelector, DateRange } from './interactive-features/date-range-selector';
import { ZoomControls, ZoomState } from './interactive-features/zoom-controls';
import { ResponsiveCalendarGrid, ResponsiveCalendarContainer } from '@/components/ui/responsive-calendar-grid';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useChartTouch } from '@/hooks/useTouch';

// Mock data generator for financial metrics
const generateMockData = (date: Date) => {
  const seed = date.getTime();
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * 9.301) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };
  
  const volatility = random(0, 1);
  const performance = random(-0.15, 0.15);
  const volume = random(1000000, 100000000);
  
  return {
    volatility,
    performance,
    volume,
    price: random(40000, 70000),
    liquidity: random(0.1, 1),
  };
};

type ViewType = 'day' | 'week' | 'month';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFocused?: boolean;
  onClick: () => void;
  onHover: (data: any) => void;
  onLeave: () => void;
}

  const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  isFocused,
  onClick,
  onHover,
  onLeave,
}) => {
  const data = useMemo(() => generateMockData(date), [date]);
  const { isMobile } = useBreakpoint();
  
  const getVolatilityColor = (volatility: number) => {
    if (volatility < 0.3) return 'bg-volatility-low/20 border-volatility-low/40';
    if (volatility < 0.7) return 'bg-volatility-medium/20 border-volatility-medium/40';
    return 'bg-volatility-high/20 border-volatility-high/40';
  };
  
  const getPerformanceIndicator = (performance: number) => {
    if (performance > 0.02) return <TrendingUp className="w-3 h-3 text-performance-positive" />;
    if (performance < -0.02) return <TrendingDown className="w-3 h-3 text-performance-negative" />;
    return <BarChart3 className="w-3 h-3 text-performance-neutral" />;
  };

  // Enhanced touch handling for mobile
  const handleTouch = (action: 'start' | 'end') => {
    if (action === 'start') {
      onHover({ date, ...data });
      // Add haptic feedback simulation
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    } else {
      // Delay hiding tooltip on mobile for better UX
      setTimeout(() => onLeave(), 300);
    }
  };

  return (
    <div
      className={cn(
        "relative border border-border rounded-lg cursor-pointer transition-all duration-200 group touch-manipulation focus:outline-none",
        // Responsive height classes
        isMobile ? "h-12 min-h-[44px]" : "h-16 sm:h-20 lg:h-24",
        "hover:scale-105 hover:shadow-lg",
        getVolatilityColor(data.volatility),
        isCurrentMonth ? "opacity-100" : "opacity-40",
        isToday && "ring-4 ring-primary animate-pulse-glow shadow-glow",
        isSelected && "ring-2 ring-accent scale-105",
        isFocused && "ring-2 ring-secondary scale-102"
      )}
      tabIndex={0}
      onClick={onClick}
      onMouseEnter={() => onHover({ date, ...data })}
      onMouseLeave={onLeave}
      onTouchStart={() => handleTouch('start')}
      onTouchEnd={() => handleTouch('end')}
    >
      <div className="p-1 sm:p-2 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className={cn(
            "font-medium",
            isMobile ? "text-xs" : "text-xs sm:text-sm lg:text-base",
            isToday ? "text-primary font-bold bg-primary/10 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full border-2 border-primary/30" : "text-foreground"
          )}>
            {date.getDate()}
            {isToday && !isMobile && <span className="text-[8px] sm:text-[10px] block leading-none text-primary/80">TODAY</span>}
          </span>
          <div className={cn("flex-shrink-0", isMobile ? "w-3 h-3" : "w-3 h-3 sm:w-4 sm:h-4")}>
            {getPerformanceIndicator(data.performance)}
          </div>
        </div>
        
        {!isMobile && (
          <div className="flex items-end justify-between mt-1">
            <div className="flex flex-col space-y-0.5 sm:space-y-1 min-w-0">
              <div 
                className="h-0.5 sm:h-1 rounded-full bg-primary/30 min-w-[4px]"
                style={{ 
                  width: `${Math.max(4, Math.min(32, data.volume / 10000000))}px`,
                  backgroundColor: `hsl(var(--primary) / ${0.3 + data.liquidity * 0.4})`
                }}
              />
              <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {(data.performance * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
    </div>
  );
};


interface FinancialCalendarProps {
  onDateSelect?: (date: Date | null) => void;
  selectedDate?: Date | null;
  onDateRangeChange?: (range: DateRange) => void;
  onViewTypeChange?: (viewType: ViewType) => void;
}

export const FinancialCalendar: React.FC<FinancialCalendarProps> = ({ 
  onDateSelect,
  selectedDate: externalSelectedDate,
  onDateRangeChange,
  onViewTypeChange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(null);
  const selectedDate = externalSelectedDate !== undefined ? externalSelectedDate : internalSelectedDate;
  const [viewType, setViewType] = useState<ViewType>('month');
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  
  // Interactive features state
  const [filters, setFilters] = useState<FilterOptions>({
    instrument: 'BTC/USD',
    volatilityRange: [0, 1],
    performanceRange: [-0.15, 0.15],
    volumeThreshold: 1000000,
    showOnlyTradingDays: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [zoomState, setZoomState] = useState<ZoomState>({ level: 1.0, centerDate: new Date() });
  const [showControls, setShowControls] = useState(false);

  const today = useMemo(() => new Date(), []);
  
  const monthStart = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    return start;
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const dayOfWeek = end.getDay();
    end.setDate(end.getDate() + (6 - dayOfWeek));
    return end;
  }, [currentDate]);

  const calendarDays = useMemo(() => {
    const days = [];
    const current = new Date(monthStart);
    
    while (current <= monthEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [monthStart, monthEnd]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  // Listen for mouse move events from child components
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  const handleDateClick = (date: Date) => {
    if (isRangeMode) {
      if (!dateRange.start || (dateRange.start && dateRange.end)) {
        // Start new range
        const newRange = { start: date, end: null };
        setDateRange(newRange);
        onDateRangeChange?.(newRange);
      } else if (dateRange.start && !dateRange.end) {
        // Complete range
        const start = dateRange.start;
        const end = date;
        const newRange = { 
          start: start < end ? start : end,
          end: start < end ? end : start
        };
        setDateRange(newRange);
        onDateRangeChange?.(newRange);
      }
    } else {
      // Clear date range when not in range mode
      if (dateRange.start || dateRange.end) {
        setDateRange({ start: null, end: null });
        onDateRangeChange?.({ start: null, end: null });
      }
      
      // Normal date selection
      const newSelectedDate = selectedDate?.toDateString() === date.toDateString() ? null : date;
      if (onDateSelect) {
        onDateSelect(newSelectedDate);
      } else {
        setInternalSelectedDate(newSelectedDate);
      }
    }
  };

  const handleHover = (data: any) => {
    setHoveredData(data);
    setShowTooltip(true);
  };

  const handleHoverLeave = () => {
    setShowTooltip(false);
    setHoveredData(null);
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }

      const currentFocused = focusedDate || selectedDate || today;
      if (!currentFocused) return;

      let newDate: Date | null = null;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newDate = new Date(currentFocused);
          if (viewType === 'day') {
            newDate.setDate(currentFocused.getDate() - 1);
          } else if (viewType === 'week') {
            newDate.setDate(currentFocused.getDate() - 7);
          } else {
            newDate.setMonth(currentFocused.getMonth() - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          newDate = new Date(currentFocused);
          if (viewType === 'day') {
            newDate.setDate(currentFocused.getDate() + 1);
          } else if (viewType === 'week') {
            newDate.setDate(currentFocused.getDate() + 7);
          } else {
            newDate.setMonth(currentFocused.getMonth() + 1);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          window.scrollBy({ top: -200, behavior: 'smooth' });
          break;
        case 'ArrowDown':
          e.preventDefault();
          window.scrollBy({ top: 200, behavior: 'smooth' });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleDateClick(currentFocused);
          break;
        case 'Escape':
          e.preventDefault();
          setFocusedDate(null);
          if (onDateSelect) {
            onDateSelect(null);
          } else {
            setInternalSelectedDate(null);
          }
          break;
        case 'Home':
          e.preventDefault();
          setFocusedDate(today);
          setCurrentDate(today);
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setFocusedDate(today);
          setCurrentDate(today);
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          setViewType('day');
          onViewTypeChange?.('day');
          break;
        case 'w':
        case 'W':
          e.preventDefault();
          setViewType('week');
          onViewTypeChange?.('week');
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setViewType('month');
          onViewTypeChange?.('month');
          break;
      }

      if (newDate) {
        setFocusedDate(newDate);
        setCurrentDate(newDate);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedDate, selectedDate, today, viewType, handleDateClick, onDateSelect]);

  // Auto-focus today on mount
  React.useEffect(() => {
    setFocusedDate(today);
  }, [today]);

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const isFocused = (date: Date) => {
    return focusedDate?.toDateString() === date.toDateString();
  };

  return (
    <div className="w-full mx-auto space-y-4 sm:space-y-6" onMouseMove={handleMouseMove}>
      {/* Header */}
      <Card className="p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              Financial Calendar
            </h1>
          </div>
          
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            {/* Interactive Controls Toggle */}
            <Button
              variant={showControls ? "default" : "outline"}
              size="sm"
              onClick={() => setShowControls(!showControls)}
              className="flex items-center space-x-1 w-full sm:w-auto justify-center"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Controls</span>
            </Button>
            
            {/* View Type Selector */}
            <div className="flex border border-border rounded-lg overflow-hidden w-full sm:w-auto">
              {(['day', 'week', 'month'] as ViewType[]).map((type) => (
                <Button
                  key={type}
                  variant={viewType === type ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setViewType(type);
                    onViewTypeChange?.(type);
                    // Clear selections when switching views
                    if (onDateSelect) {
                      onDateSelect(null);
                    } else {
                      setInternalSelectedDate(null);
                    }
                    // Clear date range if not in range mode
                    if (!isRangeMode && (dateRange.start || dateRange.end)) {
                      setDateRange({ start: null, end: null });
                      onDateRangeChange?.({ start: null, end: null });
                    }
                    // Disable range mode when switching away from day view
                    if (type !== 'day' && isRangeMode) {
                      setIsRangeMode(false);
                      setDateRange({ start: null, end: null });
                      onDateRangeChange?.({ start: null, end: null });
                    }
                  }}
                  className="rounded-none first:rounded-l-lg last:rounded-r-lg flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <span className="sm:hidden">{type.charAt(0).toUpperCase()}</span>
                </Button>
              ))}
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
                className="flex-shrink-0 p-2 sm:px-3"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Prev</span>
              </Button>
              <span className="text-sm sm:text-base lg:text-lg font-semibold text-center flex-1 sm:min-w-[140px] lg:min-w-[180px] px-2">
                <span className="hidden sm:inline">
                  {currentDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="sm:hidden">
                  {currentDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: '2-digit' 
                  })}
                </span>
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('next')}
                className="flex-shrink-0 p-2 sm:px-3"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Controls */}
      {showControls && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <FilterControls
            filters={filters}
            onFiltersChange={setFilters}
            isExpanded={showFilters}
            onToggleExpanded={() => setShowFilters(!showFilters)}
          />
          <DateRangeSelector
            dateRange={dateRange}
            onDateRangeChange={(range) => {
              setDateRange(range);
              onDateRangeChange?.(range);
            }}
            isActive={isRangeMode}
            onToggleActive={() => {
              const newRangeMode = !isRangeMode;
              setIsRangeMode(newRangeMode);
              // Clear range when disabling range mode
              if (!newRangeMode) {
                const clearedRange = { start: null, end: null };
                setDateRange(clearedRange);
                onDateRangeChange?.(clearedRange);
              }
            }}
            isDisabled={viewType !== 'day'}
          />
          <div className="sm:col-span-2 lg:col-span-1">
            <ZoomControls
              zoomState={zoomState}
              onZoomChange={setZoomState}
              currentDate={currentDate}
            />
          </div>
        </div>
      )}

      {/* View Content */}
      <div className="min-h-[400px]" style={{ 
        transform: `scale(${zoomState.level})`,
        transformOrigin: 'center top',
        transition: 'transform 0.3s ease-out'
      }}>
        {viewType === 'day' && (
          <DailyView
            selectedDate={currentDate}
            onDateChange={setCurrentDate}
            onDateSelect={handleDateClick}
            selectedForDashboard={selectedDate}
            onHover={handleHover}
            onHoverLeave={handleHoverLeave}
            filters={filters}
            dateRange={isRangeMode ? dateRange : undefined}
          />
        )}
        {viewType === 'week' && (
          <WeeklyView
            selectedDate={currentDate}
            onDateChange={setCurrentDate}
            onDateSelect={handleDateClick}
            selectedForDashboard={selectedDate}
            onHover={handleHover}
            onHoverLeave={handleHoverLeave}
            filters={filters}
            dateRange={isRangeMode ? dateRange : undefined}
          />
        )}
        {viewType === 'month' && (
          <MonthlyView
            selectedDate={currentDate}
            onDateChange={setCurrentDate}
            onDateSelect={handleDateClick}
            selectedForDashboard={selectedDate}
            onHover={handleHover}
            onHoverLeave={handleHoverLeave}
            filters={filters}
            dateRange={isRangeMode ? dateRange : undefined}
          />
        )}
      </div>

      {/* Legend with Keyboard Navigation Help */}
      <Card className="p-3 sm:p-4 lg:p-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Data Indicators */}
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-start sm:space-x-8">
            {/* Volatility Legend */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <span className="text-sm font-semibold text-foreground min-w-fit">Volatility:</span>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-volatility-low/50 border-2 border-volatility-low rounded-sm flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">Low</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-volatility-medium/50 border-2 border-volatility-medium rounded-sm flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">Med</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-volatility-high/50 border-2 border-volatility-high rounded-sm flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">High</span>
                </div>
              </div>
            </div>
            
            {/* Performance Legend */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <span className="text-sm font-semibold text-foreground min-w-fit">Performance:</span>
              <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                <div className="flex items-center space-x-1.5">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-performance-positive flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Positive</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-performance-negative flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Negative</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-performance-neutral flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Neutral</span>
                </div>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-border"></div>

          {/* Keyboard Navigation Help */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Keyboard Navigation</h4>
            <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-4 sm:gap-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">←</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">→</kbd>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Navigate dates</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">↑</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">↓</kbd>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Scroll page</span>
              </div>
              <div className="flex items-center space-x-2 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">Enter</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">Space</kbd>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Select</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">T</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">Home</kbd>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Go to today</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">D</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">W</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">M</kbd>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Switch views</span>
              </div>
              <div className="flex items-center space-x-2 sm:col-span-2 lg:col-span-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">Esc</kbd>
                <span className="text-xs sm:text-sm text-muted-foreground">Clear selection</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Responsive Tooltip */}
      <ResponsiveTooltip 
        data={hoveredData} 
        position={mousePosition} 
        visible={showTooltip} 
      >
        {null}
      </ResponsiveTooltip>
    </div>
  );
};