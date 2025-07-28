import { Orderbook, Ticker24h, Kline, FinancialData } from '@/types/api';
import { coinbaseAPI } from './coinbase-api';
import { okxAPI } from './okx-api';
import { kucoinAPI } from './kucoin-api';
import { mockDataService } from './mock-data-service';

export type APISource = 'coinbase' | 'okx' | 'kucoin' | 'mock';

interface APIHealth {
  source: APISource;
  isHealthy: boolean;
  lastChecked: number;
  responseTime?: number;
  errorCount: number;
  consecutiveFailures: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class APIManagerService {
  private static instance: APIManagerService;
  private apiHealth: Map<APISource, APIHealth> = new Map();
  private preferredOrder: APISource[] = ['coinbase', 'okx', 'kucoin'];
  private currentSource: APISource = 'coinbase';
  private fallbackToMock: boolean = false;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  };

  static getInstance(): APIManagerService {
    if (!APIManagerService.instance) {
      APIManagerService.instance = new APIManagerService();
    }
    return APIManagerService.instance;
  }

  constructor() {
    // Initialize health tracking
    this.preferredOrder.forEach(source => {
      this.apiHealth.set(source, {
        source,
        isHealthy: true,
        lastChecked: 0,
        errorCount: 0,
        consecutiveFailures: 0
      });
    });
  }

  private getAPIService(source: APISource) {
    switch (source) {
      case 'coinbase': return coinbaseAPI;
      case 'okx': return okxAPI;
      case 'kucoin': return kucoinAPI;
      default: return kucoinAPI; // fallback
    }
  }

  private async healthCheck(source: APISource): Promise<boolean> {
    try {
      const startTime = Date.now();
      const api = this.getAPIService(source);
      
      // Simple health check with ticker request
      await api.get24hTicker('BTCUSDT');
      
      const responseTime = Date.now() - startTime;
      this.updateHealth(source, true, responseTime);
      return true;
    } catch (error) {
      this.updateHealth(source, false);
      return false;
    }
  }

  private updateHealth(source: APISource, isHealthy: boolean, responseTime?: number) {
    const health = this.apiHealth.get(source);
    if (health) {
      health.isHealthy = isHealthy;
      health.lastChecked = Date.now();
      health.responseTime = responseTime;
      health.errorCount = isHealthy ? 0 : health.errorCount + 1;
      health.consecutiveFailures = isHealthy ? 0 : health.consecutiveFailures + 1;
      
      // Auto-enable mock fallback if all APIs are failing
      if (health.consecutiveFailures >= this.retryConfig.maxRetries) {
        this.checkAndEnableMockFallback();
      }
    }
  }

  private checkAndEnableMockFallback() {
    const allUnhealthy = Array.from(this.apiHealth.values()).every(
      health => health.consecutiveFailures >= this.retryConfig.maxRetries
    );
    if (allUnhealthy && !this.fallbackToMock) {
      console.warn('All APIs failing, enabling mock data fallback');
      this.fallbackToMock = true;
    }
  }

  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    source: APISource
  ): Promise<T> {
    const health = this.apiHealth.get(source);
    if (!health) throw new Error(`No health info for source: ${source}`);

    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        this.updateHealth(source, true);
        return result;
      } catch (error) {
        this.updateHealth(source, false);
        
        if (attempt === this.retryConfig.maxRetries - 1) {
          throw error;
        }
        
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private getAPIForSource(source: APISource): { api: any; source: APISource } {
    this.currentSource = source;
    return { api: this.getAPIService(source), source };
  }

  async testConnection(source: APISource): Promise<boolean> {
    return await this.healthCheck(source);
  }

  async refreshHealthStatus(): Promise<void> {
    const promises = this.preferredOrder.map(source => this.healthCheck(source));
    await Promise.allSettled(promises);
  }

  async getOrderbook(symbol: string, limit: number = 20): Promise<Orderbook & { source: APISource }> {
    if (this.fallbackToMock) {
      const orderbook = mockDataService.generateOrderbook(symbol);
      return {
        symbol: orderbook.symbol,
        bids: orderbook.bids,
        asks: orderbook.asks,
        lastUpdateId: orderbook.lastUpdateId,
        source: 'mock' as APISource
      };
    }

    try {
      const { api, source } = this.getAPIForSource(this.currentSource);
      const orderbook = await this.retryWithExponentialBackoff(
        () => api.getOrderbook(symbol, limit),
        source
      ) as Orderbook;
      return {
        symbol: orderbook.symbol,
        bids: orderbook.bids,
        asks: orderbook.asks,
        lastUpdateId: orderbook.lastUpdateId,
        source
      };
    } catch (error) {
      console.warn(`Orderbook API failed, falling back to mock data:`, error);
      const orderbook = mockDataService.generateOrderbook(symbol);
      return {
        symbol: orderbook.symbol,
        bids: orderbook.bids,
        asks: orderbook.asks,
        lastUpdateId: orderbook.lastUpdateId,
        source: 'mock' as APISource
      };
    }
  }

  async get24hTicker(symbol: string): Promise<Ticker24h & { source: APISource }> {
    if (this.fallbackToMock) {
      const ticker = mockDataService.generate24hTicker(symbol);
      return { ...ticker, source: 'mock' as APISource };
    }

    try {
      const { api, source } = this.getAPIForSource(this.currentSource);
      const ticker = await this.retryWithExponentialBackoff(
        () => api.get24hTicker(symbol),
        source
      ) as Ticker24h;
      return { ...ticker, source };
    } catch (error) {
      console.warn(`Ticker API failed, falling back to mock data:`, error);
      const ticker = mockDataService.generate24hTicker(symbol);
      return { ...ticker, source: 'mock' as APISource };
    }
  }

  async getKlines(symbol: string, interval: string = '1day', limit: number = 30): Promise<Kline[] & { source: APISource }> {
    if (this.fallbackToMock) {
      const klines = mockDataService.generateKlines(symbol, interval, limit);
      const result = klines as Kline[] & { source: APISource };
      result.source = 'mock' as APISource;
      return result;
    }

    try {
      const { api, source } = this.getAPIForSource(this.currentSource);
      const klines = await this.retryWithExponentialBackoff(
        () => api.getKlines(symbol, interval, limit),
        source
      );
      const result = klines as Kline[] & { source: APISource };
      result.source = source;
      return result;
    } catch (error) {
      console.warn(`Klines API failed, falling back to mock data:`, error);
      const klines = mockDataService.generateKlines(symbol, interval, limit);
      const result = klines as Kline[] & { source: APISource };
      result.source = 'mock' as APISource;
      return result;
    }
  }

  transformToFinancialData(ticker: Ticker24h, klines: Kline[]): FinancialData[] {
    if (this.fallbackToMock) {
      return mockDataService.transformToFinancialData(ticker, klines);
    }
    const api = this.getAPIService(this.currentSource);
    return api.transformToFinancialData(ticker, klines);
  }

  getCurrentSource(): APISource {
    return this.currentSource;
  }

  getAPIHealth(): APIHealth[] {
    return Array.from(this.apiHealth.values());
  }

  async switchToAPI(source: APISource): Promise<boolean> {
    if (this.preferredOrder.includes(source)) {
      this.currentSource = source;
      return true;
    }
    return false;
  }

  async forceSwitch(source: APISource): Promise<void> {
    this.currentSource = source;
    this.fallbackToMock = false; // Reset mock fallback when switching sources
  }

  getIsMockMode(): boolean {
    return this.fallbackToMock;
  }

  async enableMockMode(): Promise<void> {
    this.fallbackToMock = true;
  }

  async disableMockMode(): Promise<void> {
    this.fallbackToMock = false;
  }
}

export const apiManager = APIManagerService.getInstance();