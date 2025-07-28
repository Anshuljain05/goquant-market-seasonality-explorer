import { Orderbook, Ticker24h, Kline, FinancialData } from '@/types/api';

class CoinbaseAPIService {
  private static instance: CoinbaseAPIService;
  private baseURL = 'https://api.exchange.coinbase.com';

  static getInstance(): CoinbaseAPIService {
    if (!CoinbaseAPIService.instance) {
      CoinbaseAPIService.instance = new CoinbaseAPIService();
    }
    return CoinbaseAPIService.instance;
  }

  private formatSymbol(symbol: string): string {
    // Convert BTCUSDT to BTC-USD format
    if (symbol.includes('USDT')) {
      return symbol.replace('USDT', '-USD');
    }
    return symbol;
  }

  async getOrderbook(symbol: string, limit: number = 20): Promise<Orderbook> {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const response = await fetch(`${this.baseURL}/products/${formattedSymbol}/book?level=2`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        symbol: symbol,
        bids: data.bids.slice(0, limit).map(([price, quantity]: [string, string]) => ({
          price,
          quantity
        })),
        asks: data.asks.slice(0, limit).map(([price, quantity]: [string, string]) => ({
          price,
          quantity
        })),
        lastUpdateId: Date.now()
      };
    } catch (error) {
      console.error('Coinbase orderbook fetch failed:', error);
      return this.getMockOrderbook(symbol);
    }
  }

  async get24hTicker(symbol: string): Promise<Ticker24h> {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const [tickerResponse, statsResponse] = await Promise.all([
        fetch(`${this.baseURL}/products/${formattedSymbol}/ticker`),
        fetch(`${this.baseURL}/products/${formattedSymbol}/stats`)
      ]);

      if (!tickerResponse.ok || !statsResponse.ok) {
        throw new Error('API request failed');
      }

      const ticker = await tickerResponse.json();
      const stats = await statsResponse.json();

      return {
        symbol: symbol,
        priceChange: (parseFloat(ticker.price) - parseFloat(stats.open)).toString(),
        priceChangePercent: (((parseFloat(ticker.price) - parseFloat(stats.open)) / parseFloat(stats.open)) * 100).toString(),
        weightedAvgPrice: ticker.price,
        prevClosePrice: stats.open,
        lastPrice: ticker.price,
        bidPrice: ticker.bid,
        askPrice: ticker.ask,
        openPrice: stats.open,
        highPrice: stats.high,
        lowPrice: stats.low,
        volume: stats.volume,
        quoteVolume: stats.volume_30day,
        openTime: Date.now() - 24 * 60 * 60 * 1000,
        closeTime: Date.now(),
        count: 0
      };
    } catch (error) {
      console.error('Coinbase ticker fetch failed:', error);
      return this.getMock24hTicker(symbol);
    }
  }

  async getKlines(symbol: string, interval: string = '1day', limit: number = 30): Promise<Kline[]> {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const end = new Date();
      const start = new Date(end.getTime() - limit * 24 * 60 * 60 * 1000);
      
      const response = await fetch(
        `${this.baseURL}/products/${formattedSymbol}/candles?start=${start.toISOString()}&end=${end.toISOString()}&granularity=86400`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((candle: number[]) => ({
        openTime: candle[0] * 1000,
        open: candle[3].toString(),
        high: candle[2].toString(),
        low: candle[1].toString(),
        close: candle[4].toString(),
        volume: candle[5].toString(),
        closeTime: (candle[0] + 86400) * 1000,
        quoteAssetVolume: '0',
        numberOfTrades: 0,
        takerBuyBaseAssetVolume: '0',
        takerBuyQuoteAssetVolume: '0'
      })).reverse();
    } catch (error) {
      console.error('Coinbase klines fetch failed:', error);
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

export const coinbaseAPI = CoinbaseAPIService.getInstance();