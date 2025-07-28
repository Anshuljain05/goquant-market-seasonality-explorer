export interface IndicatorResult {
  value: number;
  signal?: 'buy' | 'sell' | 'neutral';
}

export interface RSIResult extends IndicatorResult {
  overbought: boolean;
  oversold: boolean;
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  bullish: boolean;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  width: number;
  position: number; // 0-1, where price is within bands
}

// Simple Moving Average
export const calculateSMA = (data: number[], period: number): number[] => {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
};

// Exponential Moving Average
export const calculateEMA = (data: number[], period: number): number[] => {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  const firstSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(NaN);
    } else if (i === period - 1) {
      ema.push(firstSMA);
    } else {
      ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }
  }
  return ema;
};

// RSI Calculation
export const calculateRSI = (prices: number[], period: number = 14): RSIResult[] => {
  const rsi: RSIResult[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate RSI
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      rsi.push({ value: NaN, overbought: false, oversold: false });
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      
      rsi.push({
        value: rsiValue,
        overbought: rsiValue > 70,
        oversold: rsiValue < 30,
        signal: rsiValue > 70 ? 'sell' : rsiValue < 30 ? 'buy' : 'neutral'
      });
    }
  }
  
  return rsi;
};

// MACD Calculation
export const calculateMACD = (
  prices: number[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): MACDResult[] => {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const macdLine: number[] = [];
  
  // Calculate MACD line
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Calculate signal line
  const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signalPeriod);
  
  // Pad signal line to match length
  const paddedSignalLine = [...Array(macdLine.length - signalLine.length).fill(NaN), ...signalLine];
  
  // Calculate histogram and results
  const results: MACDResult[] = [];
  for (let i = 0; i < prices.length; i++) {
    const macd = macdLine[i];
    const signal = paddedSignalLine[i];
    const histogram = isNaN(macd) || isNaN(signal) ? NaN : macd - signal;
    
    results.push({
      macd: macd || 0,
      signal: signal || 0,
      histogram: histogram || 0,
      bullish: !isNaN(histogram) && histogram > 0
    });
  }
  
  return results;
};

// Bollinger Bands Calculation
export const calculateBollingerBands = (
  prices: number[], 
  period: number = 20, 
  stdDev: number = 2
): BollingerBandsResult[] => {
  const sma = calculateSMA(prices, period);
  const results: BollingerBandsResult[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1 || isNaN(sma[i])) {
      results.push({
        upper: NaN,
        middle: NaN,
        lower: NaN,
        width: NaN,
        position: NaN
      });
    } else {
      const periodData = prices.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = periodData.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      const upper = mean + (standardDeviation * stdDev);
      const lower = mean - (standardDeviation * stdDev);
      const width = upper - lower;
      const position = width > 0 ? (prices[i] - lower) / width : 0.5;
      
      results.push({
        upper,
        middle: mean,
        lower,
        width,
        position: Math.max(0, Math.min(1, position))
      });
    }
  }
  
  return results;
};

// Support and Resistance Levels
export const findSupportResistance = (prices: number[], period: number = 20): {
  support: number[];
  resistance: number[];
} => {
  const support: number[] = [];
  const resistance: number[] = [];
  
  for (let i = period; i < prices.length - period; i++) {
    const window = prices.slice(i - period, i + period + 1);
    const currentPrice = prices[i];
    
    // Check if current price is a local minimum (support)
    const isSupport = window.every((price, index) => 
      index === period || price >= currentPrice
    );
    
    // Check if current price is a local maximum (resistance)
    const isResistance = window.every((price, index) => 
      index === period || price <= currentPrice
    );
    
    support.push(isSupport ? currentPrice : NaN);
    resistance.push(isResistance ? currentPrice : NaN);
  }
  
  return { support, resistance };
};