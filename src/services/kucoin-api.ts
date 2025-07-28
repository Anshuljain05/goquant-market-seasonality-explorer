import { Orderbook, Ticker24h, Kline, FinancialData, KuCoinOrderbook, KuCoinTicker, KuCoinCandle } from '@/types/api';

const KUCOIN_BASE_URL = 'https://api.kucoin.com/api/v1';

export class KuCoinAPIService {
  private static instance: KuCoinAPIService;

  static getInstance(): KuCoinAPIService {
    if (!KuCoinAPIService.instance) {
      KuCoinAPIService.instance = new KuCoinAPIService();
    }
    return KuCoinAPIService.instance;
  }

  // Convert symbol format (BTCUSDT -> BTC-USDT)
  private formatSymbol(symbol: string): string {
    // If already formatted, return as is
    if (symbol.includes('-')) return symbol;
    
    // Convert common pairs
    const commonPairs = ['USDT', 'BTC', 'ETH', 'BNB', 'USDC'];
    for (const quote of commonPairs) {
      if (symbol.endsWith(quote)) {
        const base = symbol.slice(0, -quote.length);
        return `${base}-${quote}`;
      }
    }
    
    // Fallback - assume last 4 chars are quote currency
    if (symbol.length > 4) {
      const base = symbol.slice(0, -4);
      const quote = symbol.slice(-4);
      return `${base}-${quote}`;
    }
    
    return symbol;
  }

  async getOrderbook(symbol: string = 'BTCUSDT', limit: number = 20): Promise<Orderbook> {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const response = await fetch(`${KUCOIN_BASE_URL}/market/orderbook/level2_20?symbol=${formattedSymbol}`);
      
      if (!response.ok) throw new Error('Failed to fetch orderbook');
      
      const result = await response.json();
      const data = result.data as KuCoinOrderbook;
      
      return {
        symbol: formattedSymbol,
        bids: data.bids.map(([price, quantity]) => ({ price, quantity })),
        asks: data.asks.map(([price, quantity]) => ({ price, quantity })),
        lastUpdateId: parseInt(data.sequence)
      };
    } catch (error) {
      console.error('Error fetching KuCoin orderbook:', error);
      return this.getMockOrderbook(symbol);
    }
  }

  async get24hTicker(symbol: string = 'BTCUSDT'): Promise<Ticker24h> {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const response = await fetch(`${KUCOIN_BASE_URL}/market/stats?symbol=${formattedSymbol}`);
      
      if (!response.ok) throw new Error('Failed to fetch 24h ticker');
      
      const result = await response.json();
      const data = result.data as KuCoinTicker;
      
      // Transform KuCoin data to Binance format for compatibility
      return {
        symbol: formattedSymbol,
        priceChange: data.changePrice,
        priceChangePercent: (parseFloat(data.changeRate) * 100).toFixed(2),
        weightedAvgPrice: data.averagePrice,
        prevClosePrice: (parseFloat(data.last) - parseFloat(data.changePrice)).toFixed(2),
        lastPrice: data.last,
        bidPrice: data.buy,
        askPrice: data.sell,
        openPrice: (parseFloat(data.last) - parseFloat(data.changePrice)).toFixed(2),
        highPrice: data.high,
        lowPrice: data.low,
        volume: data.vol,
        quoteVolume: data.volValue,
        openTime: Date.now() - 24 * 60 * 60 * 1000,
        closeTime: Date.now(),
        count: 0 // KuCoin doesn't provide this
      };
    } catch (error) {
      console.error('Error fetching KuCoin 24h ticker:', error);
      return this.getMock24hTicker(symbol);
    }
  }

  async getKlines(
    symbol: string = 'BTCUSDT',
    interval: string = '1day',
    limit: number = 30
  ): Promise<Kline[]> {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const endAt = Math.floor(Date.now() / 1000);
      const startAt = endAt - (limit * 24 * 60 * 60); // Go back 'limit' days
      
      const response = await fetch(
        `${KUCOIN_BASE_URL}/market/candles?symbol=${formattedSymbol}&type=${interval}&startAt=${startAt}&endAt=${endAt}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch klines');
      
      const result = await response.json();
      const data = result.data as string[][];
      
      // KuCoin returns data in reverse chronological order, so reverse it
      return data.reverse().map((candle) => ({
        openTime: parseInt(candle[0]) * 1000, // Convert to milliseconds
        open: candle[1],
        close: candle[2],
        high: candle[3],
        low: candle[4],
        volume: candle[5],
        closeTime: (parseInt(candle[0]) + 86400) * 1000 - 1, // Add 1 day - 1ms
        quoteAssetVolume: candle[6],
        numberOfTrades: 0, // KuCoin doesn't provide this
        takerBuyBaseAssetVolume: '0',
        takerBuyQuoteAssetVolume: '0'
      }));
    } catch (error) {
      console.error('Error fetching KuCoin klines:', error);
      return this.getMockKlines(limit);
    }
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

  // Mock data fallbacks (same as Binance for compatibility)
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
      const volatility = Math.random() * 0.05;
      
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

export const kucoinAPI = KuCoinAPIService.getInstance();