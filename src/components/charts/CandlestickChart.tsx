import React, { useState, useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, LineChart, AreaChart, BarChart, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartControls } from '@/components/ui/chart-controls';
import { ChartLegend, ChartLegendConfigs } from '@/components/ui/chart-legend';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { useChartTouch } from '@/hooks/useTouch';
import { useChartOptimization } from '@/hooks/useChartOptimization';
import { formatPrice, formatVolume, formatTime, chartColors } from '@/components/ui/chart-formatters';
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands } from '@/utils/technicalIndicators';
import { Kline } from '@/types/api';

interface CandlestickChartProps {
  klines: Kline[];
  symbol: string;
}

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
}

export function CandlestickChart({ klines, symbol }: CandlestickChartProps) {
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area' | 'bar'>('candlestick');
  const [timeInterval, setTimeInterval] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'>('1h');
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);

  const handleChartTypeChange = (type: any) => {
    if (['candlestick', 'line', 'area', 'bar'].includes(type)) {
      setChartType(type);
    }
  };

  const handleTimeIntervalChange = (interval: any) => {
    if (['1m', '5m', '15m', '1h', '4h', '1d', '1w'].includes(interval)) {
      setTimeInterval(interval);
    }
  };

  // Process and optimize chart data
  const candleData: CandleData[] = useMemo(() => {
    return klines.map((kline) => {
      const open = parseFloat(kline.open);
      const close = parseFloat(kline.close);
      const high = parseFloat(kline.high);
      const low = parseFloat(kline.low);
      const volume = parseFloat(kline.volume);
      const change = close - open;
      const changePercent = (change / open) * 100;
      
      return {
        date: formatTime(kline.openTime, timeInterval === '1d' || timeInterval === '1w' ? 'day' : 'hour'),
        open,
        high,
        low,
        close,
        volume,
        change,
        changePercent
      };
    });
  }, [klines, timeInterval]);

  // Chart optimization for performance
  const optimizedData = useChartOptimization(candleData, {
    maxDataPoints: 200,
    enableVirtualization: candleData.length > 100,
    updateThrottle: 16
  });

  // Touch interactions for mobile
  const { elementRef, touchState, zoomLevel, panOffset, resetZoom } = useChartTouch(
    (scale) => {
      optimizedData.zoomToRange(
        Math.max(0, optimizedData.startIndex - Math.floor(scale * 10)),
        Math.min(candleData.length, optimizedData.endIndex + Math.floor(scale * 10))
      );
    },
    (deltaX, deltaY) => {
      const panAmount = Math.floor(deltaX / 10);
      optimizedData.panToRange(panAmount);
    },
    () => {
      optimizedData.resetView();
    }
  );

  // Calculate technical indicators
  const technicalData = useMemo(() => {
    const prices = candleData.map(d => d.close);
    const indicators: any = {};

    if (activeIndicators.includes('sma')) {
      indicators.sma20 = calculateSMA(prices, 20);
      indicators.sma50 = calculateSMA(prices, 50);
    }
    
    if (activeIndicators.includes('ema')) {
      indicators.ema12 = calculateEMA(prices, 12);
      indicators.ema26 = calculateEMA(prices, 26);
    }
    
    if (activeIndicators.includes('rsi')) {
      indicators.rsi = calculateRSI(prices, 14);
    }
    
    if (activeIndicators.includes('macd')) {
      indicators.macd = calculateMACD(prices);
    }
    
    if (activeIndicators.includes('bb')) {
      indicators.bb = calculateBollingerBands(prices, 20, 2);
    }

    return indicators;
  }, [candleData, activeIndicators]);

  // Enhanced tooltip with indicators
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dataIndex = optimizedData.data.findIndex(d => d.date === label);
      
      return (
        <ChartTooltip
          active={active}
          payload={[
            { name: 'Open', value: data.open, color: 'hsl(var(--chart-1))' },
            { name: 'High', value: data.high, color: 'hsl(var(--chart-2))' },
            { name: 'Low', value: data.low, color: 'hsl(var(--chart-3))' },
            { name: 'Close', value: data.close, color: 'hsl(var(--chart-1))' },
            { name: 'Volume', value: data.volume, color: 'hsl(var(--chart-4))' },
            ...(activeIndicators.includes('sma') && technicalData.sma20?.[dataIndex] ? 
              [{ name: 'SMA20', value: technicalData.sma20[dataIndex], color: 'hsl(var(--chart-5))' }] : []),
            ...(activeIndicators.includes('rsi') && technicalData.rsi?.[dataIndex] ? 
              [{ name: 'RSI', value: technicalData.rsi[dataIndex].value, color: 'hsl(var(--chart-6))' }] : [])
          ]}
          label={label}
          formatter={(value, name) => {
            if (name === 'Volume') return formatVolume(Number(value));
            return formatPrice(Number(value));
          }}
        />
      );
    }
    return null;
  };

  // Custom candlestick bar component
  const CandleBar = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, close, high, low } = payload;
    const isGreen = close > open;
    const color = isGreen ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))';
    
    // Calculate positions
    const bodyTop = Math.min(open, close);
    const bodyBottom = Math.max(open, close);
    const bodyHeight = Math.abs(close - open);
    
    // Scale values relative to chart
    const scale = height / (high - low);
    const wickX = x + width / 2;
    const bodyY = y + (high - bodyBottom) * scale;
    const bodyHeightScaled = bodyHeight * scale || 1; // Minimum 1px height
    
    return (
      <g>
        {/* Upper wick */}
        <line
          x1={wickX}
          y1={y + (high - high) * scale}
          x2={wickX}
          y2={bodyY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Lower wick */}
        <line
          x1={wickX}
          y1={bodyY + bodyHeightScaled}
          x2={wickX}
          y2={y + (high - low) * scale}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + width * 0.2}
          y={bodyY}
          width={width * 0.6}
          height={bodyHeightScaled}
          fill={isGreen ? color : 'none'}
          stroke={color}
          strokeWidth={isGreen ? 0 : 1}
        />
      </g>
    );
  };

  // Render different chart types
  const renderChart = () => {
    const data = optimizedData.data;
    const chartProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
      onMouseMove: (e: any) => {
        if (e?.activeLabel && e?.activeCoordinate) {
          setCrosshair({ x: e.activeCoordinate.x, y: e.activeCoordinate.y });
        }
      },
      onMouseLeave: () => setCrosshair(null)
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis domain={['dataMin - 100', 'dataMax + 100']} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            {renderIndicators()}
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis domain={['dataMin - 100', 'dataMax + 100']} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="close" stroke="hsl(var(--primary))" fill="url(#areaGradient)" />
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            {renderIndicators()}
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis domain={['dataMin - 100', 'dataMax + 100']} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="close" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            {renderIndicators()}
          </BarChart>
        );
      
      default: // candlestick
        return (
          <ComposedChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis domain={['dataMin - 100', 'dataMax + 100']} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="volume" orientation="right" domain={[0, 'dataMax']} hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" fill="hsl(var(--chart-4))" opacity={0.4} yAxisId="volume" radius={[1, 1, 0, 0]} />
            <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            {renderIndicators()}
            {crosshair && (
              <>
                <ReferenceLine x={crosshair.x} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                <ReferenceLine y={crosshair.y} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
              </>
            )}
          </ComposedChart>
        );
    }
  };

  // Render technical indicators
  const renderIndicators = () => {
    const indicators = [];
    
    if (activeIndicators.includes('sma') && technicalData.sma20) {
      indicators.push(
        <Line 
          key="sma20"
          type="monotone" 
          dataKey={() => technicalData.sma20}
          stroke="hsl(var(--chart-5))" 
          strokeWidth={2} 
          dot={false}
          name="SMA 20"
        />
      );
    }
    
    if (activeIndicators.includes('ema') && technicalData.ema12) {
      indicators.push(
        <Line 
          key="ema12"
          type="monotone" 
          dataKey={() => technicalData.ema12}
          stroke="hsl(var(--chart-6))" 
          strokeWidth={2} 
          dot={false}
          name="EMA 12"
        />
      );
    }

    return indicators;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Price Chart - {symbol}</CardTitle>
          <ChartControls
            chartType={chartType}
            onChartTypeChange={handleChartTypeChange}
            timeInterval={timeInterval}
            onTimeIntervalChange={handleTimeIntervalChange}
            onZoomIn={() => optimizedData.zoomToRange(
              optimizedData.startIndex + 10,
              optimizedData.endIndex - 10
            )}
            onZoomOut={() => optimizedData.zoomToRange(
              Math.max(0, optimizedData.startIndex - 10),
              Math.min(candleData.length, optimizedData.endIndex + 10)
            )}
            onReset={() => {
              optimizedData.resetView();
              resetZoom();
            }}
            enabledIndicators={activeIndicators}
            onToggleIndicator={(indicator) => {
              setActiveIndicators(prev => 
                prev.includes(indicator) 
                  ? prev.filter(i => i !== indicator)
                  : [...prev, indicator]
              );
            }}
          />
        </CardHeader>
        <CardContent>
        <div ref={elementRef as any} className="h-96 touch-pan-y select-none">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {/* Enhanced Summary statistics with performance metrics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-chart-1/20 to-transparent p-4 rounded-lg border border-chart-1/20 text-center">
            <p className="text-muted-foreground text-sm">Current Price</p>
            <p className="font-bold text-xl text-chart-1 font-mono">
              {formatPrice(candleData[candleData.length - 1]?.close || 0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-chart-2/20 to-transparent p-4 rounded-lg border border-chart-2/20 text-center">
            <p className="text-muted-foreground text-sm">24h Change</p>
            <p className={`font-bold text-lg font-mono ${candleData[candleData.length - 1]?.change >= 0 ? 'text-performance-positive' : 'text-performance-negative'}`}>
              {candleData[candleData.length - 1]?.change >= 0 ? '+' : ''}
              {candleData[candleData.length - 1]?.changePercent.toFixed(2)}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-chart-4/20 to-transparent p-4 rounded-lg border border-chart-4/20 text-center">
            <p className="text-muted-foreground text-sm">Volume</p>
            <p className="font-bold text-lg text-chart-4 font-mono">
              {formatVolume(candleData[candleData.length - 1]?.volume || 0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-muted/20 to-transparent p-4 rounded-lg border border-border text-center">
            <p className="text-muted-foreground text-sm">High/Low</p>
            <div className="space-y-1">
              <p className="font-bold text-chart-2 text-sm font-mono">
                {formatPrice(Math.max(...candleData.map(d => d.high)))}
              </p>
              <p className="font-bold text-chart-3 text-sm font-mono">
                {formatPrice(Math.min(...candleData.map(d => d.low)))}
              </p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-4 text-xs text-muted-foreground flex justify-between items-center">
          <span>Data Points: {optimizedData.data.length}/{candleData.length}</span>
          <span>Zoom: {zoomLevel.toFixed(1)}x</span>
          <span>Touch: {touchState.isMultiTouch ? 'Multi' : 'Single'}</span>
          <span>Performance: {optimizedData.getPerformanceMetrics()?.renderTime || 0}ms</span>
        </div>
        </CardContent>
      </Card>

      <ChartLegend 
        title="Chart Legend"
        items={ChartLegendConfigs.candlestick}
        compact
      />
    </div>
  );
}