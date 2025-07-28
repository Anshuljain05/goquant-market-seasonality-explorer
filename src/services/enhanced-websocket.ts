import { WebSocketOrderbook, Orderbook } from '@/types/api';
import { mockDataService } from './mock-data-service';

export class EnhancedWebSocketService {
  private static instance: EnhancedWebSocketService;
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private pingInterval: NodeJS.Timeout | null = null;
  private lastOrderbook: Orderbook | null = null;
  private mockDataInterval: NodeJS.Timeout | null = null;
  private isUsingMockData = false;

  static getInstance(): EnhancedWebSocketService {
    if (!EnhancedWebSocketService.instance) {
      EnhancedWebSocketService.instance = new EnhancedWebSocketService();
    }
    return EnhancedWebSocketService.instance;
  }

  async connect(symbol: string = 'btcusdt'): Promise<void> {
    // Always fall back to mock data due to CORS issues
    this.enableMockDataMode(symbol);
    return Promise.resolve();
  }

  private enableMockDataMode(symbol: string): void {
    this.isUsingMockData = true;
    this.connectionState = 'connected';
    
    // Start mock data simulation
    this.startMockDataSimulation(symbol);
    
    // Notify subscribers of connection
    this.notifySubscribers('connection', { status: 'connected', isProxy: true });
  }

  private startMockDataSimulation(symbol: string): void {
    // Generate initial orderbook
    this.lastOrderbook = mockDataService.generateOrderbook(symbol);
    
    // Simulate real-time updates every 500ms
    this.mockDataInterval = setInterval(() => {
      if (this.lastOrderbook) {
        this.lastOrderbook = mockDataService.generateRealtimeUpdate(this.lastOrderbook);
        this.notifySubscribers('orderbook', this.lastOrderbook);
      }
    }, 500);
  }

  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const channelSubscribers = this.subscribers.get(channel);
      if (channelSubscribers) {
        channelSubscribers.delete(callback);
        if (channelSubscribers.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    };
  }

  private notifySubscribers(channel: string, data: any): void {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket subscriber for channel ${channel}:`, error);
        }
      });
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.mockDataInterval) {
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
    }

    this.connectionState = 'disconnected';
    this.subscribers.clear();
    this.isUsingMockData = false;
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this.connectionState;
  }

  forceReconnect(symbol?: string): void {
    this.disconnect();
    setTimeout(() => {
      this.connect(symbol);
    }, 1000);
  }

  getIsUsingMockData(): boolean {
    return this.isUsingMockData;
  }
}

export const enhancedWebSocketService = EnhancedWebSocketService.getInstance();