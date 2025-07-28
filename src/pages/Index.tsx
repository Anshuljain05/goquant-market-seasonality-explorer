import React, { useState, useMemo } from 'react';
import { FinancialCalendar } from '@/components/financial-calendar';
import { DataDashboard } from '@/components/data-dashboard';
import { ThemeSelector } from '@/components/ui/theme-selector';

// Mock data generator (same as in financial-calendar)
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

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeRange, setActiveRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('month');
  
  const selectedData = useMemo(() => {
    return selectedDate ? generateMockData(selectedDate) : null;
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Controls */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-2 sm:px-4 py-2">
          <div className="flex justify-end">
            <ThemeSelector />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2 sm:p-4 lg:p-6">
        <div className="container mx-auto space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl px-2 sm:px-4">
          {/* Main Calendar */}
          <div className="animate-fade-in">
            <FinancialCalendar 
              onDateSelect={setSelectedDate} 
              selectedDate={selectedDate}
              onDateRangeChange={(range) => {
                setActiveRange(range);
                // Clear single date selection when range is active
                if (range.start && range.end) {
                  setSelectedDate(null);
                }
              }}
              onViewTypeChange={setViewType}
            />
          </div>
          
          {/* Dashboard Panel */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <DataDashboard 
              selectedDate={selectedDate} 
              data={selectedData} 
              dateRange={activeRange}
              viewType={viewType}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
