import { Orderbook, Ticker24h, Kline, FinancialData } from '@/types/api';

export class MockDataService {
  private static instance: MockDataService;

  static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  // Generate realistic mock orderbook with bid/ask spread
  generateOrderbook(symbol: string = 'BTCUSDT'): Orderbook {
    const basePrice = 45000 + (Math.random() - 0.5) * 10000;
    const spread = basePrice * 0.0002; // 0.02% spread
    
    const bids = Array.from({ length: 20 }, (_, i) => ({
      price: (basePrice - spread / 2 - (i + 1) * Math.random() * 50).toFixed(2),
      quantity: (Math.random() * 2 + 0.1).toFixed(4)
    }));
    
    const asks = Array.from({ length: 20 }, (_, i) => ({
      price: (basePrice + spread / 2 + (i + 1) * Math.random() * 50).toFixed(2),
      quantity: (Math.random() * 2 + 0.1).toFixed(4)
    }));

    return {
      symbol,
      bids: bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)),
      asks: asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
      lastUpdateId: Date.now()
    };
  }

  // Generate realistic 24h ticker with market-like movements
  generate24hTicker(symbol: string = 'BTCUSDT'): Ticker24h {
    const basePrice = 45000 + (Math.random() - 0.5) * 10000;
    const volatility = Math.random() * 0.1; // Up to 10% daily volatility
    const change = (Math.random() - 0.5) * volatility * basePrice;
    const volume = Math.random() * 50000 + 10000;
    
    const openPrice = basePrice - change;
    const closePrice = basePrice;
    const highPrice = Math.max(openPrice, closePrice) * (1 + Math.random() * 0.05);
    const lowPrice = Math.min(openPrice, closePrice) * (1 - Math.random() * 0.05);

    return {
      symbol,
      priceChange: change.toFixed(2),
      priceChangePercent: ((change / openPrice) * 100).toFixed(2),
      weightedAvgPrice: ((openPrice + closePrice) / 2).toFixed(2),
      prevClosePrice: openPrice.toFixed(2),
      lastPrice: closePrice.toFixed(2),
      bidPrice: (closePrice - 25).toFixed(2),
      askPrice: (closePrice + 25).toFixed(2),
      openPrice: openPrice.toFixed(2),
      highPrice: highPrice.toFixed(2),
      lowPrice: lowPrice.toFixed(2),
      volume: volume.toFixed(2),
      quoteVolume: (volume * closePrice).toFixed(2),
      openTime: Date.now() - 24 * 60 * 60 * 1000,
      closeTime: Date.now(),
      count: Math.floor(Math.random() * 100000 + 50000)
    };
  }

  // Generate realistic historical klines with trending patterns
  generateKlines(symbol: string = 'BTCUSDT', interval: string = '1day', limit: number = 30): Kline[] {
    const now = Date.now();
    const intervalMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    
    let currentPrice = 45000 + (Math.random() - 0.5) * 10000;
    const trend = (Math.random() - 0.5) * 0.002; // Overall trend direction
    
    return Array.from({ length: limit }, (_, i) => {
      const time = now - (limit - i - 1) * intervalMs;
      
      // Add trend and random walk
      const dailyChange = trend + (Math.random() - 0.5) * 0.03;
      const open = currentPrice;
      const close = open * (1 + dailyChange);
      
      // Generate realistic high/low based on volatility
      const volatility = Math.random() * 0.05;
      const high = Math.max(open, close) * (1 + volatility / 2);
      const low = Math.min(open, close) * (1 - volatility / 2);
      
      const volume = Math.random() * 20000 + 5000;
      currentPrice = close; // Use for next iteration

      return {
        openTime: time,
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume: volume.toFixed(2),
        closeTime: time + intervalMs - 1,
        quoteAssetVolume: (volume * close).toFixed(2),
        numberOfTrades: Math.floor(Math.random() * 5000 + 1000),
        takerBuyBaseAssetVolume: (volume * 0.55).toFixed(2),
        takerBuyQuoteAssetVolume: (volume * close * 0.55).toFixed(2)
      };
    });
  }

  // Generate realistic real-time price movements
  generateRealtimeUpdate(currentOrderbook: Orderbook): Orderbook {
    if (!currentOrderbook) return this.generateOrderbook();

    const bids = currentOrderbook.bids.map(bid => ({
      ...bid,
      price: (parseFloat(bid.price) * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2),
      quantity: (parseFloat(bid.quantity) * (1 + (Math.random() - 0.5) * 0.2)).toFixed(4)
    }));

    const asks = currentOrderbook.asks.map(ask => ({
      ...ask,
      price: (parseFloat(ask.price) * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2),
      quantity: (parseFloat(ask.quantity) * (1 + (Math.random() - 0.5) * 0.2)).toFixed(4)
    }));

    return {
      ...currentOrderbook,
      bids: bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)),
      asks: asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
      lastUpdateId: Date.now()
    };
  }

  transformToFinancialData(ticker: Ticker24h, klines: Kline[]): FinancialData[] {
    return klines.map((kline) => {
      const date = new Date(kline.openTime);
      const open = parseFloat(kline.open);
      const close = parseFloat(kline.close);
      const high = parseFloat(kline.high);
      const low = parseFloat(kline.low);
      const volume = parseFloat(kline.volume);

      const volatility = ((high - low) / open) * 100;
      const performance = ((close - open) / open) * 100;
      const liquidity = Math.min(volume / 1000, 100);

      return {
        date,
        volatility: Math.abs(volatility),
        performance,
        volume,
        price: close,
        liquidity,
        high,
        low,
        open,
        close
      };
    });
  }
}

export const mockDataService = MockDataService.getInstance();