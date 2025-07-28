import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartLegend, ChartLegendConfigs } from '@/components/ui/chart-legend';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { useChartTouch } from '@/hooks/useTouch';
import { useChartOptimization } from '@/hooks/useChartOptimization';
import { formatVolume, formatPrice } from '@/components/ui/chart-formatters';
import { Kline } from '@/types/api';

interface VolumeChartProps {
  klines: Kline[];
  symbol: string;
}

export function VolumeChart({ klines, symbol }: VolumeChartProps) {
  const volumeData = klines.map((kline) => {
    const volume = parseFloat(kline.volume);
    const open = parseFloat(kline.open);
    const close = parseFloat(kline.close);
    const isPositive = close > open;
    
    return {
      date: new Date(kline.openTime).toLocaleDateString(),
      volume,
      isPositive,
      quoteVolume: parseFloat(kline.quoteAssetVolume),
      trades: kline.numberOfTrades
    };
  });

  // Chart optimization for performance
  const optimizedData = useChartOptimization(volumeData, {
    maxDataPoints: 100,
    enableVirtualization: volumeData.length > 50,
    updateThrottle: 16
  });

  // Touch interactions for mobile
  const { elementRef, touchState, zoomLevel, resetZoom } = useChartTouch(
    (scale) => {
      optimizedData.zoomToRange(
        Math.max(0, optimizedData.startIndex - Math.floor(scale * 5)),
        Math.min(volumeData.length, optimizedData.endIndex + Math.floor(scale * 5))
      );
    },
    (deltaX, deltaY) => {
      const panAmount = Math.floor(deltaX / 10);
      optimizedData.panToRange(panAmount);
    },
    () => {
      optimizedData.resetView();
      resetZoom();
    }
  );

  const avgVolume = volumeData.reduce((sum, data) => sum + data.volume, 0) / volumeData.length;
  const maxVolume = Math.max(...volumeData.map(d => d.volume));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <ChartTooltip
          active={active}
          payload={[
            { name: 'Volume', value: data.volume, color: 'hsl(var(--chart-4))' },
            { name: 'Quote Volume', value: data.quoteVolume, color: 'hsl(var(--chart-5))' },
            { name: 'Trades', value: data.trades, color: 'hsl(var(--muted-foreground))' },
            { name: 'vs Avg', value: ((data.volume / avgVolume - 1) * 100), color: data.volume > avgVolume ? 'hsl(var(--performance-positive))' : 'hsl(var(--performance-negative))' }
          ]}
          label={label}
          formatter={(value, name) => {
            if (name === 'Volume') return formatVolume(Number(value));
            if (name === 'Quote Volume') return formatPrice(Number(value));
            if (name === 'vs Avg') return `${Number(value).toFixed(1)}%`;
            return Number(value).toLocaleString();
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Volume Analysis - {symbol}</CardTitle>
        </CardHeader>
        <CardContent>
        <div ref={elementRef as any} className="h-64 touch-pan-y select-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={optimizedData.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--muted-foreground))"
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => formatVolume(value)}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="volume" radius={[3, 3, 0, 0]}>
                {optimizedData.data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))'} 
                    opacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-chart-4/20 to-transparent p-4 rounded-lg border border-chart-4/20 text-center">
            <p className="text-muted-foreground text-sm">Avg Volume</p>
            <p className="font-bold text-lg text-chart-4 font-mono">{formatVolume(avgVolume)}</p>
          </div>
          <div className="bg-gradient-to-br from-chart-5/20 to-transparent p-4 rounded-lg border border-chart-5/20 text-center">
            <p className="text-muted-foreground text-sm">Max Volume</p>
            <p className="font-bold text-lg text-chart-5 font-mono">{formatVolume(maxVolume)}</p>
          </div>
          <div className="bg-gradient-to-br from-chart-6/20 to-transparent p-4 rounded-lg border border-chart-6/20 text-center">
            <p className="text-muted-foreground text-sm">Latest Volume</p>
            <p className="font-bold text-lg text-chart-6 font-mono">
              {formatVolume(volumeData[volumeData.length - 1]?.volume || 0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-muted/20 to-transparent p-4 rounded-lg border border-border text-center">
            <p className="text-muted-foreground text-sm">Volume Trend</p>
            <p className={`font-bold text-lg ${
              volumeData[volumeData.length - 1]?.volume > avgVolume ? 'text-performance-positive' : 'text-performance-negative'
            }`}>
              {volumeData[volumeData.length - 1]?.volume > avgVolume ? 'Above' : 'Below'} Avg
            </p>
          </div>
        </div>

        {/* Volume Distribution & Performance */}
        <div className="mt-6 bg-muted/20 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Volume Distribution</h4>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-chart-2 animate-pulse-glow"></div>
              <span className="text-chart-2 font-medium">Positive Days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-chart-3 animate-pulse-glow"></div>
              <span className="text-chart-3 font-medium">Negative Days</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground flex justify-between items-center">
            <span>Data Points: {optimizedData.data.length}/{volumeData.length}</span>
            <span>Zoom: {zoomLevel.toFixed(1)}x</span>
            <span>Touch: {touchState.isMultiTouch ? 'Multi' : 'Single'}</span>
          </div>
        </div>
        </CardContent>
      </Card>

      <ChartLegend 
        title="Volume Chart Legend"
        items={ChartLegendConfigs.volume}
        compact
      />
    </div>
  );
}