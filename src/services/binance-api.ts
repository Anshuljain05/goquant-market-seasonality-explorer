import { Orderbook, Ticker24h, Kline, FinancialData } from '@/types/api';

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

export class BinanceAPIService {
  private static instance: BinanceAPIService;

  static getInstance(): BinanceAPIService {
    if (!BinanceAPIService.instance) {
      BinanceAPIService.instance = new BinanceAPIService();
    }
    return BinanceAPIService.instance;
  }

  async getOrderbook(symbol: string = 'BTCUSDT', limit: number = 20): Promise<Orderbook> {
    try {
      const response = await fetch(`${BINANCE_BASE_URL}/depth?symbol=${symbol}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch orderbook');
      
      const data = await response.json();
      return {
        symbol,
        bids: data.bids.map(([price, quantity]: [string, string]) => ({ price, quantity })),
        asks: data.asks.map(([price, quantity]: [string, string]) => ({ price, quantity })),
        lastUpdateId: data.lastUpdateId
      };
    } catch (error) {
      console.error('Error fetching orderbook:', error);
      // Fallback to mock data
      return this.getMockOrderbook(symbol);
    }
  }

  async get24hTicker(symbol: string = 'BTCUSDT'): Promise<Ticker24h> {
    try {
      const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr?symbol=${symbol}`);
      if (!response.ok) throw new Error('Failed to fetch 24h ticker');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching 24h ticker:', error);
      // Fallback to mock data
      return this.getMock24hTicker(symbol);
    }
  }

  async getKlines(
    symbol: string = 'BTCUSDT',
    interval: string = '1d',
    limit: number = 30
  ): Promise<Kline[]> {
    try {
      const response = await fetch(
        `${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      if (!response.ok) throw new Error('Failed to fetch klines');
      
      const data = await response.json();
      return data.map((k: any[]) => ({
        openTime: k[0],
        open: k[1],
        high: k[2],
        low: k[3],
        close: k[4],
        volume: k[5],
        closeTime: k[6],
        quoteAssetVolume: k[7],
        numberOfTrades: k[8],
        takerBuyBaseAssetVolume: k[9],
        takerBuyQuoteAssetVolume: k[10]
      }));
    } catch (error) {
      console.error('Error fetching klines:', error);
      // Fallback to mock data
      return this.getMockKlines(limit);
    }
  }

  transformToFinancialData(ticker: Ticker24h, klines: Kline[]): FinancialData[] {
    return klines.map((kline, index) => {
      const date = new Date(kline.openTime);
      const open = parseFloat(kline.open);
      const close = parseFloat(kline.close);
      const high = parseFloat(kline.high);
      const low = parseFloat(kline.low);
      const volume = parseFloat(kline.volume);

      // Calculate volatility as percentage difference between high and low
      const volatility = ((high - low) / open) * 100;
      
      // Calculate performance as percentage change
      const performance = ((close - open) / open) * 100;
      
      // Normalize liquidity based on volume (simple normalization)
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

  // Mock data fallbacks
  private getMockOrderbook(symbol: string): Orderbook {
    const basePrice = 45000;
    const bids = Array.from({ length: 10 }, (_, i) => ({
      price: (basePrice - (i + 1) * 10).toString(),
      quantity: (Math.random() * 5 + 0.1).toFixed(4)
    }));
    const asks = Array.from({ length: 10 }, (_, i) => ({
      price: (basePrice + (i + 1) * 10).toString(),
      quantity: (Math.random() * 5 + 0.1).toFixed(4)
    }));

    return { symbol, bids, asks, lastUpdateId: Date.now() };
  }

  private getMock24hTicker(symbol: string): Ticker24h {
    const price = 45000 + (Math.random() - 0.5) * 1000;
    const change = (Math.random() - 0.5) * 5;
    
    return {
      symbol,
      priceChange: change.toFixed(2),
      priceChangePercent: (change / price * 100).toFixed(2),
      weightedAvgPrice: price.toFixed(2),
      prevClosePrice: (price - change).toFixed(2),
      lastPrice: price.toFixed(2),
      bidPrice: (price - 5).toFixed(2),
      askPrice: (price + 5).toFixed(2),
      openPrice: (price - change).toFixed(2),
      highPrice: (price + Math.abs(change) * 2).toFixed(2),
      lowPrice: (price - Math.abs(change) * 2).toFixed(2),
      volume: (Math.random() * 10000 + 1000).toFixed(2),
      quoteVolume: (Math.random() * 500000000 + 100000000).toFixed(2),
      openTime: Date.now() - 24 * 60 * 60 * 1000,
      closeTime: Date.now(),
      count: Math.floor(Math.random() * 100000 + 50000)
    };
  }

  private getMockKlines(limit: number): Kline[] {
    const now = Date.now();
    return Array.from({ length: limit }, (_, i) => {
      const time = now - (limit - i - 1) * 24 * 60 * 60 * 1000;
      const basePrice = 45000 + (Math.random() - 0.5) * 5000;
      const volatility = Math.random() * 0.05; // 5% max daily volatility
      
      const open = basePrice;
      const close = open * (1 + (Math.random() - 0.5) * volatility);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.random() * 10000 + 1000;

      return {
        openTime: time,
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume: volume.toFixed(2),
        closeTime: time + 24 * 60 * 60 * 1000 - 1,
        quoteAssetVolume: (volume * close).toFixed(2),
        numberOfTrades: Math.floor(Math.random() * 10000 + 1000),
        takerBuyBaseAssetVolume: (volume * 0.6).toFixed(2),
        takerBuyQuoteAssetVolume: (volume * close * 0.6).toFixed(2)
      };
    });
  }
}

export const binanceAPI = BinanceAPIService.getInstance();