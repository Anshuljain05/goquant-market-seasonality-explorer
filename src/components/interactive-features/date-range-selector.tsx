import React from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  isActive: boolean;
  onToggleActive: () => void;
  isDisabled?: boolean;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRange,
  onDateRangeChange,
  isActive,
  onToggleActive,
  isDisabled = false
}) => {
  const clearRange = () => {
    onDateRangeChange({ start: null, end: null });
  };

  const hasSelection = dateRange.start || dateRange.end;

  return (
    <Card className={cn("p-4", isDisabled && "opacity-50")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Date Range Selection</h3>
          {isActive && !isDisabled && (
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          )}
        </div>
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={onToggleActive}
          disabled={isDisabled}
        >
          {isActive ? 'Disable' : 'Enable'} Range Mode
        </Button>
      </div>

      {isDisabled && (
        <p className="text-sm text-muted-foreground">
          Range selection is only available in Day view mode
        </p>
      )}

      {!isDisabled && isActive && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Click on calendar dates to select a range for analysis
          </p>
          
          {hasSelection && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Range:</span>
                <Button variant="ghost" size="sm" onClick={clearRange}>
                  <X className="w-3 h-3" />
                  Clear
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Start:</span>
                  <div className={cn(
                    "p-2 rounded border",
                    dateRange.start ? "bg-primary/10 border-primary/20" : "bg-muted border-muted"
                  )}>
                    {dateRange.start ? 
                      dateRange.start.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric' 
                      }) : 
                      'Not selected'
                    }
                  </div>
                </div>
                
                <div className="space-y-1">
                  <span className="text-muted-foreground">End:</span>
                  <div className={cn(
                    "p-2 rounded border",
                    dateRange.end ? "bg-primary/10 border-primary/20" : "bg-muted border-muted"
                  )}>
                    {dateRange.end ? 
                      dateRange.end.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric' 
                      }) : 
                      'Not selected'
                    }
                  </div>
                </div>
              </div>

              {dateRange.start && dateRange.end && (
                <div className="p-2 bg-accent/10 rounded border border-accent/20">
                  <span className="text-sm font-medium">
                    Range: {Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Analysis will appear in the dashboard below
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};