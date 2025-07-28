import { Orderbook, Ticker24h, Kline, FinancialData } from '@/types/api';

class OKXAPIService {
  private static instance: OKXAPIService;
  private baseURL = 'https://www.okx.com/api/v5';

  static getInstance(): OKXAPIService {
    if (!OKXAPIService.instance) {
      OKXAPIService.instance = new OKXAPIService();
    }
    return OKXAPIService.instance;
  }

  private formatSymbol(symbol: string): string {
    // Convert BTCUSDT to BTC-USDT format
    if (symbol.includes('USDT')) {
      return symbol.replace('USDT', '-USDT');
    }
    return symbol;
  }

  async getOrderbook(symbol: string, limit: number = 20): Promise<Orderbook> {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const response = await fetch(`${this.baseURL}/market/books?instId=${formattedSymbol}&sz=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== '0' || !data.data[0]) {
        throw new Error('Invalid response format');
      }

      const orderbook = data.data[0];
      
      return {
        symbol: symbol,
        bids: orderbook.bids.map(([price, quantity]: [string, string]) => ({
          price,
          quantity
        })),
        asks: orderbook.asks.map(([price, quantity]: [string, string]) => ({
          price,
          quantity
        })),
        lastUpdateId: parseInt(orderbook.ts)
      };
    } catch (error) {
      console.error('OKX orderbook fetch failed:', error);
      return this.getMockOrderbook(symbol);
    }
  }

  async get24hTicker(symbol: string): Promise<Ticker24h> {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const response = await fetch(`${this.baseURL}/market/ticker?instId=${formattedSymbol}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== '0' || !data.data[0]) {
        throw new Error('Invalid response format');
      }

      const ticker = data.data[0];

      return {
        symbol: symbol,
        priceChange: (parseFloat(ticker.last) - parseFloat(ticker.open24h)).toString(),
        priceChangePercent: (((parseFloat(ticker.last) - parseFloat(ticker.open24h)) / parseFloat(ticker.open24h)) * 100).toString(),
        weightedAvgPrice: ticker.last,
        prevClosePrice: ticker.open24h,
        lastPrice: ticker.last,
        bidPrice: ticker.bidPx,
        askPrice: ticker.askPx,
        openPrice: ticker.open24h,
        highPrice: ticker.high24h,
        lowPrice: ticker.low24h,
        volume: ticker.vol24h,
        quoteVolume: ticker.volCcy24h,
        openTime: parseInt(ticker.ts) - 24 * 60 * 60 * 1000,
        closeTime: parseInt(ticker.ts),
        count: 0
      };
    } catch (error) {
      console.error('OKX ticker fetch failed:', error);
      return this.getMock24hTicker(symbol);
    }
  }

  async getKlines(symbol: string, interval: string = '1D', limit: number = 30): Promise<Kline[]> {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const response = await fetch(
        `${this.baseURL}/market/candles?instId=${formattedSymbol}&bar=${interval}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== '0') {
        throw new Error('Invalid response format');
      }
      
      return data.data.map((candle: string[]) => ({
        openTime: parseInt(candle[0]),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
        closeTime: parseInt(candle[0]) + 24 * 60 * 60 * 1000,
        quoteAssetVolume: candle[6],
        numberOfTrades: 0,
        takerBuyBaseAssetVolume: '0',
        takerBuyQuoteAssetVolume: '0'
      })).reverse();
    } catch (error) {
      console.error('OKX klines fetch failed:', error);
      return this.getMockKlines(symbol, limit);
    }
  }

  transformToFinancialData(ticker: Ticker24h, klines: Kline[]): FinancialData[] {
    return klines.map((kline, index) => {
      const open = parseFloat(kline.open);
      const close = parseFloat(kline.close);
      const high = parseFloat(kline.high);
      const low = parseFloat(kline.low);
      const volume = parseFloat(kline.volume);
      
      const priceRange = high - low;
      const volatility = (priceRange / open) * 100;
      const performance = ((close - open) / open) * 100;
      
      const prevClose = index > 0 ? parseFloat(klines[index - 1].close) : open;
      const liquidity = volume * close;

      return {
        date: new Date(kline.openTime),
        volatility,
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

  private getMockOrderbook(symbol: string): Orderbook {
    const basePrice = 65000;
    const spread = 10;
    
    return {
      symbol,
      bids: Array.from({ length: 20 }, (_, i) => ({
        price: (basePrice - spread - i * 5).toString(),
        quantity: (Math.random() * 2).toFixed(4)
      })),
      asks: Array.from({ length: 20 }, (_, i) => ({
        price: (basePrice + spread + i * 5).toString(),
        quantity: (Math.random() * 2).toFixed(4)
      })),
      lastUpdateId: Date.now()
    };
  }

  private getMock24hTicker(symbol: string): Ticker24h {
    const lastPrice = 65000 + Math.random() * 1000;
    const openPrice = lastPrice * (0.98 + Math.random() * 0.04);
    const high = Math.max(lastPrice, openPrice) * (1 + Math.random() * 0.02);
    const low = Math.min(lastPrice, openPrice) * (1 - Math.random() * 0.02);
    
    return {
      symbol,
      priceChange: (lastPrice - openPrice).toFixed(2),
      priceChangePercent: (((lastPrice - openPrice) / openPrice) * 100).toFixed(2),
      weightedAvgPrice: ((lastPrice + openPrice) / 2).toFixed(2),
      prevClosePrice: openPrice.toFixed(2),
      lastPrice: lastPrice.toFixed(2),
      bidPrice: (lastPrice - 5).toFixed(2),
      askPrice: (lastPrice + 5).toFixed(2),
      openPrice: openPrice.toFixed(2),
      highPrice: high.toFixed(2),
      lowPrice: low.toFixed(2),
      volume: (Math.random() * 1000).toFixed(2),
      quoteVolume: (Math.random() * 50000000).toFixed(2),
      openTime: Date.now() - 24 * 60 * 60 * 1000,
      closeTime: Date.now(),
      count: Math.floor(Math.random() * 10000)
    };
  }

  private getMockKlines(symbol: string, limit: number): Kline[] {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let currentPrice = 65000;
    
    return Array.from({ length: limit }, (_, i) => {
      const openTime = now - (limit - i) * dayMs;
      const open = currentPrice;
      const change = (Math.random() - 0.5) * 0.1;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.05);
      const low = Math.min(open, close) * (1 - Math.random() * 0.05);
      const volume = Math.random() * 1000;
      
      currentPrice = close;
      
      return {
        openTime,
        open: open.toString(),
        high: high.toString(),
        low: low.toString(),
        close: close.toString(),
        volume: volume.toString(),
        closeTime: openTime + dayMs,
        quoteAssetVolume: (volume * close).toString(),
        numberOfTrades: Math.floor(Math.random() * 1000),
        takerBuyBaseAssetVolume: (volume * 0.6).toString(),
        takerBuyQuoteAssetVolume: (volume * close * 0.6).toString()
      };
    });
  }
}

export const okxAPI = OKXAPIService.getInstance();