import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartLegend, ChartLegendConfigs } from '@/components/ui/chart-legend';
import { Orderbook } from '@/types/api';

interface OrderbookChartProps {
  orderbook: Orderbook | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function OrderbookChart({ orderbook, connectionStatus }: OrderbookChartProps) {
  if (!orderbook) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Order Book
            <Badge variant="secondary">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading orderbook data...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for visualization
  const bidsData = orderbook.bids.slice(0, 10).map((bid, index) => ({
    price: parseFloat(bid.price),
    quantity: parseFloat(bid.quantity),
    type: 'bid',
    level: index + 1,
    displayPrice: bid.price,
    total: orderbook.bids.slice(0, index + 1).reduce((sum, b) => sum + parseFloat(b.quantity), 0)
  }));

  const asksData = orderbook.asks.slice(0, 10).map((ask, index) => ({
    price: parseFloat(ask.price),
    quantity: parseFloat(ask.quantity),
    type: 'ask',
    level: index + 1,
    displayPrice: ask.price,
    total: orderbook.asks.slice(0, index + 1).reduce((sum, a) => sum + parseFloat(a.quantity), 0)
  }));

  // Combine and sort data
  const combinedData = [...bidsData, ...asksData].sort((a, b) => b.price - a.price);

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order Book - {orderbook.symbol}</span>
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(connectionStatus)} text-white`}
            >
              {getStatusText(connectionStatus)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="space-y-4">
          {/* Price spread info */}
          {orderbook.asks.length > 0 && orderbook.bids.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Spread: ${(parseFloat(orderbook.asks[0].price) - parseFloat(orderbook.bids[0].price)).toFixed(2)}
              ({(((parseFloat(orderbook.asks[0].price) - parseFloat(orderbook.bids[0].price)) / parseFloat(orderbook.asks[0].price)) * 100).toFixed(3)}%)
            </div>
          )}

          {/* Orderbook Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={combinedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="horizontal"
              >
               <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number" 
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => value.toFixed(4)}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  type="category" 
                  dataKey="displayPrice"
                  width={80}
                  tickFormatter={(value) => `$${parseFloat(value).toFixed(0)}`}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
                  {combinedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.type === 'bid' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))'} 
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Orderbook Table */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Bids */}
            <div className="bg-gradient-to-r from-chart-2/5 to-transparent p-3 rounded-lg border border-chart-2/20">
              <h4 className="font-semibold text-chart-2 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                Bids
              </h4>
              <div className="space-y-1">
                {bidsData.slice(0, 5).map((bid, index) => (
                  <div key={index} className="flex justify-between hover:bg-chart-2/10 p-1 rounded transition-colors">
                    <span className="text-chart-2 font-mono text-sm">${bid.displayPrice}</span>
                    <span className="text-foreground font-mono text-sm">{bid.quantity.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Asks */}
            <div className="bg-gradient-to-r from-chart-3/5 to-transparent p-3 rounded-lg border border-chart-3/20">
              <h4 className="font-semibold text-chart-3 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                Asks
              </h4>
              <div className="space-y-1">
                {asksData.slice(0, 5).map((ask, index) => (
                  <div key={index} className="flex justify-between hover:bg-chart-3/10 p-1 rounded transition-colors">
                    <span className="text-chart-3 font-mono text-sm">${ask.displayPrice}</span>
                    <span className="text-foreground font-mono text-sm">{ask.quantity.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>

      <ChartLegend 
        title="Order Book Legend"
        items={ChartLegendConfigs.orderbook}
        compact
      />
    </div>
  );
}