import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Orderbook } from '@/types/api';

interface OrderbookEnhancementsProps {
  orderbook: Orderbook | null;
  previousOrderbook?: Orderbook | null;
  className?: string;
}

interface PriceLevel {
  price: number;
  quantity: number;
  total: number;
  change?: 'increased' | 'decreased' | 'new' | 'removed';
}

export const OrderbookEnhancements: React.FC<OrderbookEnhancementsProps> = ({
  orderbook,
  previousOrderbook,
  className
}) => {
  const [priceChanges, setPriceChanges] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!orderbook || !previousOrderbook) return;

    const changes = new Map<string, string>();
    
    // Compare bids
    orderbook.bids.forEach((bid, index) => {
      const prevBid = previousOrderbook.bids[index];
      if (prevBid) {
        const currentQty = parseFloat(bid.quantity);
        const prevQty = parseFloat(prevBid.quantity);
        if (currentQty > prevQty) {
          changes.set(`bid-${bid.price}`, 'increased');
        } else if (currentQty < prevQty) {
          changes.set(`bid-${bid.price}`, 'decreased');
        }
      } else {
        changes.set(`bid-${bid.price}`, 'new');
      }
    });

    // Compare asks
    orderbook.asks.forEach((ask, index) => {
      const prevAsk = previousOrderbook.asks[index];
      if (prevAsk) {
        const currentQty = parseFloat(ask.quantity);
        const prevQty = parseFloat(prevAsk.quantity);
        if (currentQty > prevQty) {
          changes.set(`ask-${ask.price}`, 'increased');
        } else if (currentQty < prevQty) {
          changes.set(`ask-${ask.price}`, 'decreased');
        }
      } else {
        changes.set(`ask-${ask.price}`, 'new');
      }
    });

    setPriceChanges(changes);

    // Clear changes after animation
    const timer = setTimeout(() => {
      setPriceChanges(new Map());
    }, 1000);

    return () => clearTimeout(timer);
  }, [orderbook, previousOrderbook]);

  if (!orderbook) return null;

  const preparePriceLevels = (orders: Array<{price: string, quantity: string}>, type: 'bid' | 'ask'): PriceLevel[] => {
    let total = 0;
    return orders.slice(0, 10).map((order) => {
      const price = parseFloat(order.price);
      const quantity = parseFloat(order.quantity);
      total += quantity;
      
      return {
        price,
        quantity,
        total,
        change: priceChanges.get(`${type}-${order.price}`) as PriceLevel['change']
      };
    });
  };

  const bids = preparePriceLevels(orderbook.bids, 'bid');
  const asks = preparePriceLevels(orderbook.asks, 'ask');

  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  const spread = bestAsk - bestBid;
  const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;

  const maxBidTotal = Math.max(...bids.map(b => b.total));
  const maxAskTotal = Math.max(...asks.map(a => a.total));
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);

  const getChangeClass = (change?: PriceLevel['change']) => {
    switch (change) {
      case 'increased': return 'bg-performance-positive/20 animate-pulse';
      case 'decreased': return 'bg-performance-negative/20 animate-pulse';
      case 'new': return 'bg-primary/20 animate-bounce';
      default: return '';
    }
  };

  // Calculate order imbalance
  const totalBidVolume = bids.reduce((sum, bid) => sum + bid.quantity, 0);
  const totalAskVolume = asks.reduce((sum, ask) => sum + ask.quantity, 0);
  const imbalance = totalBidVolume / (totalBidVolume + totalAskVolume);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Market Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" />
            Market Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-performance-positive/20 to-transparent border border-performance-positive/20">
              <p className="text-xs text-muted-foreground">Best Bid</p>
              <p className="font-mono font-bold text-performance-positive">${bestBid.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-performance-negative/20 to-transparent border border-performance-negative/20">
              <p className="text-xs text-muted-foreground">Best Ask</p>
              <p className="font-mono font-bold text-performance-negative">${bestAsk.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-warning/20 to-transparent border border-warning/20">
              <p className="text-xs text-muted-foreground">Spread</p>
              <p className="font-mono font-bold text-warning">${spread.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{spreadPercent.toFixed(3)}%</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-primary/20 to-transparent border border-primary/20">
              <p className="text-xs text-muted-foreground">Imbalance</p>
              <div className="space-y-1">
                <Progress value={imbalance * 100} className="h-1" />
                <p className="text-xs font-medium">
                  {imbalance > 0.5 ? 'Buy' : 'Sell'} {Math.abs(imbalance - 0.5) * 200}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Orderbook */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Order Book - {orderbook.symbol}
            </span>
            <Badge variant="outline" className="text-xs">
              Live Updates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              <div className="text-left">Price (USD)</div>
              <div className="text-right">Size</div>
              <div className="text-right">Total</div>
            </div>

            {/* Asks (Sell Orders) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-3 h-3 text-performance-negative" />
                <span className="text-xs font-medium text-performance-negative">Asks (Sell Orders)</span>
              </div>
              {asks.reverse().map((ask, index) => (
                <div
                  key={`ask-${ask.price}`}
                  className={cn(
                    "grid grid-cols-3 gap-2 text-xs py-1 px-2 rounded relative transition-all duration-300",
                    getChangeClass(ask.change)
                  )}
                >
                  <div className="text-performance-negative font-mono font-medium">
                    ${ask.price.toFixed(2)}
                  </div>
                  <div className="text-right font-mono">
                    {ask.quantity.toFixed(4)}
                  </div>
                  <div className="text-right font-mono text-muted-foreground">
                    {ask.total.toFixed(4)}
                  </div>
                  {/* Depth visualization */}
                  <div 
                    className="absolute right-0 top-0 h-full bg-performance-negative/10 rounded-r -z-10"
                    style={{ width: `${(ask.total / maxTotal) * 100}%` }}
                  />
                </div>
              ))}
            </div>

            {/* Spread Indicator */}
            <div className="flex items-center justify-center py-2 border-y bg-muted/20 rounded">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Spread</p>
                <p className="font-mono font-bold text-warning">
                  ${spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)
                </p>
              </div>
            </div>

            {/* Bids (Buy Orders) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3 h-3 text-performance-positive" />
                <span className="text-xs font-medium text-performance-positive">Bids (Buy Orders)</span>
              </div>
              {bids.map((bid, index) => (
                <div
                  key={`bid-${bid.price}`}
                  className={cn(
                    "grid grid-cols-3 gap-2 text-xs py-1 px-2 rounded relative transition-all duration-300",
                    getChangeClass(bid.change)
                  )}
                >
                  <div className="text-performance-positive font-mono font-medium">
                    ${bid.price.toFixed(2)}
                  </div>
                  <div className="text-right font-mono">
                    {bid.quantity.toFixed(4)}
                  </div>
                  <div className="text-right font-mono text-muted-foreground">
                    {bid.total.toFixed(4)}
                  </div>
                  {/* Depth visualization */}
                  <div 
                    className="absolute right-0 top-0 h-full bg-performance-positive/10 rounded-r -z-10"
                    style={{ width: `${(bid.total / maxTotal) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};