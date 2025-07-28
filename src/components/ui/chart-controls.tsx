import React from 'react';
import { BarChart3, LineChart, TrendingUp, Layers, Settings, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type ChartType = 'candlestick' | 'line' | 'area' | 'bar';
export type TimeInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

interface ChartControlsProps {
  chartType: ChartType;
  timeInterval: TimeInterval;
  onChartTypeChange: (type: ChartType) => void;
  onTimeIntervalChange: (interval: TimeInterval) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  enabledIndicators?: string[];
  onToggleIndicator?: (indicator: string) => void;
  className?: string;
}

const chartTypeIcons = {
  candlestick: BarChart3,
  line: LineChart,
  area: TrendingUp,
  bar: Layers
};

const timeIntervals: { value: TimeInterval; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' },
  { value: '1w', label: '1w' }
];

const technicalIndicators = [
  { id: 'sma', label: 'SMA', description: 'Simple Moving Average' },
  { id: 'ema', label: 'EMA', description: 'Exponential Moving Average' },
  { id: 'rsi', label: 'RSI', description: 'Relative Strength Index' },
  { id: 'macd', label: 'MACD', description: 'Moving Average Convergence Divergence' },
  { id: 'bb', label: 'BB', description: 'Bollinger Bands' }
];

export const ChartControls: React.FC<ChartControlsProps> = ({
  chartType,
  timeInterval,
  onChartTypeChange,
  onTimeIntervalChange,
  onZoomIn,
  onZoomOut,
  onReset,
  enabledIndicators = [],
  onToggleIndicator,
  className
}) => {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 p-4 bg-muted/20 rounded-lg border", className)}>
      {/* Chart Type Selection */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Chart:</span>
        <div className="flex gap-1">
          {(Object.keys(chartTypeIcons) as ChartType[]).map((type) => {
            const Icon = chartTypeIcons[type];
            return (
              <Button
                key={type}
                variant={chartType === type ? "default" : "outline"}
                size="sm"
                onClick={() => onChartTypeChange(type)}
                className="px-2"
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          })}
        </div>
      </div>

      <Separator orientation="vertical" className="hidden sm:block" />

      {/* Time Interval */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Interval:</span>
        <Select value={timeInterval} onValueChange={onTimeIntervalChange}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeIntervals.map((interval) => (
              <SelectItem key={interval.value} value={interval.value}>
                {interval.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="hidden sm:block" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
          disabled={!onZoomIn}
          className="px-2"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
          disabled={!onZoomOut}
          className="px-2"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!onReset}
          className="px-2"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="hidden sm:block" />

      {/* Technical Indicators */}
      {onToggleIndicator && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Indicators:</span>
          <div className="flex gap-1 flex-wrap">
            {technicalIndicators.map((indicator) => {
              const isEnabled = enabledIndicators.includes(indicator.id);
              return (
                <Button
                  key={indicator.id}
                  variant={isEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToggleIndicator(indicator.id)}
                  className="px-2 text-xs"
                >
                  {indicator.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Enabled Indicators Badge */}
      {enabledIndicators.length > 0 && (
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            {enabledIndicators.length} indicator{enabledIndicators.length !== 1 ? 's' : ''} active
          </Badge>
        </div>
      )}
    </div>
  );
};