import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartLegend, ChartLegendConfigs } from '@/components/ui/chart-legend';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { useChartTouch } from '@/hooks/useTouch';
import { useChartOptimization } from '@/hooks/useChartOptimization';
import { formatPrice, formatVolume } from '@/components/ui/chart-formatters';
import { Orderbook } from '@/types/api';

interface DepthChartProps {
  orderbook: Orderbook | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function DepthChart({ orderbook, connectionStatus }: DepthChartProps) {
  // Touch interactions for mobile
  const { elementRef, touchState, zoomLevel, resetZoom } = useChartTouch(
    (scale) => {
      // Handle pinch zoom for depth view
    },
    (deltaX, deltaY) => {
      // Handle panning
    },
    () => {
      // Handle reset zoom
    }
  );

  if (!orderbook) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Market Depth
            <Badge variant="secondary">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading market depth data...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare depth data for visualization
  const prepareDepthData = () => {
    const bidsWithCumulative = orderbook.bids.slice(0, 20).map((bid, index) => {
      const cumulative = orderbook.bids.slice(0, index + 1).reduce((sum, b) => sum + parseFloat(b.quantity), 0);
      return {
        price: parseFloat(bid.price),
        quantity: parseFloat(bid.quantity),
        cumulative,
        type: 'bid'
      };
    }).sort((a, b) => b.price - a.price);

    const asksWithCumulative = orderbook.asks.slice(0, 20).map((ask, index) => {
      const cumulative = orderbook.asks.slice(0, index + 1).reduce((sum, a) => sum + parseFloat(a.quantity), 0);
      return {
        price: parseFloat(ask.price),
        quantity: parseFloat(ask.quantity),
        cumulative,
        type: 'ask'
      };
    }).sort((a, b) => a.price - b.price);

    return { bidsWithCumulative, asksWithCumulative };
  };

  const { bidsWithCumulative, asksWithCumulative } = prepareDepthData();
  
  // Optimize depth data for performance
  const optimizedBids = useChartOptimization(bidsWithCumulative, {
    maxDataPoints: 50,
    enableVirtualization: bidsWithCumulative.length > 30
  });
  
  const optimizedAsks = useChartOptimization(asksWithCumulative, {
    maxDataPoints: 50,
    enableVirtualization: asksWithCumulative.length > 30
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-performance-positive';
      case 'connecting': return 'bg-warning';
      case 'error': return 'bg-performance-negative';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Live';
      case 'connecting': return 'Connecting';
      case 'error': return 'Error';
      default: return 'Offline';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <ChartTooltip
          active={active}
          payload={[
            { name: 'Price', value: data.price, color: 'hsl(var(--primary))' },
            { name: 'Quantity', value: data.quantity, color: 'hsl(var(--chart-4))' },
            { name: 'Cumulative', value: data.cumulative, color: 'hsl(var(--chart-5))' },
            { name: 'Type', value: data.type === 'bid' ? 'Bid' : 'Ask', color: data.type === 'bid' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))' }
          ]}
          label={`Price: ${formatPrice(data.price)}`}
          formatter={(value, name) => {
            if (name === 'Price') return formatPrice(Number(value));
            if (name === 'Type') return String(value);
            return formatVolume(Number(value));
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
          <CardTitle className="flex items-center justify-between">
            <span>Market Depth - {orderbook.symbol}</span>
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(connectionStatus)} text-white animate-pulse-glow`}
            >
              {getStatusText(connectionStatus)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="space-y-6">
          {/* Bid Depth Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-chart-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-chart-2 rounded-full animate-pulse-glow"></div>
              Bid Depth
            </h4>
            <div ref={elementRef as any} className="h-48 touch-pan-y select-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={optimizedBids.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="price" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => value.toFixed(2)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="hsl(var(--chart-2))"
                    fill="url(#bidGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ask Depth Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-chart-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-chart-3 rounded-full animate-pulse-glow"></div>
              Ask Depth
            </h4>
            <div className="h-48 touch-pan-y select-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={optimizedAsks.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="price" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => value.toFixed(2)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="hsl(var(--chart-3))"
                    fill="url(#askGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-chart-2/20 to-transparent p-3 rounded-lg border border-chart-2/20 text-center">
              <p className="text-muted-foreground text-xs">Best Bid</p>
              <p className="font-bold text-chart-2 font-mono text-sm">
                ${bidsWithCumulative[0]?.price.toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-chart-3/20 to-transparent p-3 rounded-lg border border-chart-3/20 text-center">
              <p className="text-muted-foreground text-xs">Best Ask</p>
              <p className="font-bold text-chart-3 font-mono text-sm">
                ${asksWithCumulative[0]?.price.toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-chart-4/20 to-transparent p-3 rounded-lg border border-chart-4/20 text-center">
              <p className="text-muted-foreground text-xs">Bid Depth</p>
              <p className="font-bold text-chart-4 font-mono text-sm">
                {bidsWithCumulative[bidsWithCumulative.length - 1]?.cumulative.toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-chart-5/20 to-transparent p-3 rounded-lg border border-chart-5/20 text-center">
              <p className="text-muted-foreground text-xs">Ask Depth</p>
              <p className="font-bold text-chart-5 font-mono text-sm">
                {asksWithCumulative[asksWithCumulative.length - 1]?.cumulative.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>

      <ChartLegend 
        title="Depth Chart Legend"
        items={ChartLegendConfigs.depth}
        compact
      />
    </div>
  );
}