import React from 'react';
import { Filter, Settings, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface FilterOptions {
  instrument: string;
  volatilityRange: [number, number];
  performanceRange: [number, number];
  volumeThreshold: number;
  showOnlyTradingDays: boolean;
}

interface FilterControlsProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFiltersChange,
  isExpanded,
  onToggleExpanded
}) => {
  const instruments = [
    'BTC/USD',
    'ETH/USD', 
    'AAPL',
    'TSLA',
    'SPY',
    'QQQ'
  ];

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpanded}
          className="flex items-center space-x-1"
        >
          <Settings className="w-4 h-4" />
          <span>{isExpanded ? 'Hide' : 'Show'} Advanced</span>
        </Button>
      </div>

      <div className="space-y-4">
        {/* Instrument Selection */}
        <div className="flex items-center space-x-4">
          <Label className="min-w-[100px] text-sm">Instrument:</Label>
          <Select
            value={filters.instrument}
            onValueChange={(value) => updateFilter('instrument', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {instruments.map((instrument) => (
                <SelectItem key={instrument} value={instrument}>
                  {instrument}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isExpanded && (
          <>
            {/* Volatility Range */}
            <div className="space-y-2">
              <Label className="text-sm">
                Volatility Range: {(filters.volatilityRange[0] * 100).toFixed(0)}% - {(filters.volatilityRange[1] * 100).toFixed(0)}%
              </Label>
              <Slider
                value={filters.volatilityRange}
                onValueChange={(value) => updateFilter('volatilityRange', value as [number, number])}
                max={1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Performance Range */}
            <div className="space-y-2">
              <Label className="text-sm">
                Performance Range: {(filters.performanceRange[0] * 100).toFixed(1)}% - {(filters.performanceRange[1] * 100).toFixed(1)}%
              </Label>
              <Slider
                value={filters.performanceRange}
                onValueChange={(value) => updateFilter('performanceRange', value as [number, number])}
                max={0.15}
                min={-0.15}
                step={0.001}
                className="w-full"
              />
            </div>

            {/* Volume Threshold */}
            <div className="space-y-2">
              <Label className="text-sm">
                Min Volume: ${(filters.volumeThreshold / 1000000).toFixed(1)}M
              </Label>
              <Slider
                value={[filters.volumeThreshold]}
                onValueChange={(value) => updateFilter('volumeThreshold', value[0])}
                max={100000000}
                min={1000000}
                step={1000000}
                className="w-full"
              />
            </div>

            {/* Trading Days Only */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="tradingDays"
                checked={filters.showOnlyTradingDays}
                onChange={(e) => updateFilter('showOnlyTradingDays', e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="tradingDays" className="text-sm cursor-pointer">
                Show only trading days
              </Label>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};