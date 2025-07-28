export interface OrderbookEntry {
  price: string;
  quantity: string;
}

export interface Orderbook {
  symbol: string;
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  lastUpdateId: number;
}

export interface Ticker24h {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  count: number;
}

export interface Kline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface WebSocketOrderbook {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  U: number; // First update ID
  u: number; // Final update ID
  b: [string, string][]; // Bids [price, quantity]
  a: [string, string][]; // Asks [price, quantity]
}

// KuCoin specific types
export interface KuCoinOrderbook {
  sequence: string;
  time: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface KuCoinTicker {
  symbol: string;
  symbolName: string;
  buy: string;
  sell: string;
  changeRate: string;
  changePrice: string;
  high: string;
  low: string;
  vol: string;
  volValue: string;
  last: string;
  averagePrice: string;
  takerFeeRate: string;
  makerFeeRate: string;
  takerCoefficient: string;
  makerCoefficient: string;
}

export interface KuCoinCandle {
  time: string;
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
  turnover: string;
}

export interface KuCoinWebSocketOrderbook {
  type: string;
  topic: string;
  subject: string;
  data: {
    sequenceStart: number;
    sequenceEnd: number;
    symbol: string;
    changes: {
      asks: [string, string, string][];
      bids: [string, string, string][];
    };
  };
}

export interface FinancialData {
  date: Date;
  volatility: number;
  performance: number;
  volume: number;
  price: number;
  liquidity: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
}