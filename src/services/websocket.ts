import { WebSocketOrderbook, KuCoinWebSocketOrderbook } from '@/types/api';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private token: string | null = null;
  private instanceServers: any[] = [];

  // Get WebSocket connection details from KuCoin
  private async getWebSocketInfo(): Promise<any> {
    try {
      const response = await fetch('https://api.kucoin.com/api/v1/bullet-public');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to get KuCoin WebSocket info:', error);
      throw error;
    }
  }

  private formatSymbol(symbol: string): string {
    if (symbol.includes('-')) return symbol;
    
    const commonPairs = ['USDT', 'BTC', 'ETH', 'BNB', 'USDC'];
    for (const quote of commonPairs) {
      if (symbol.toUpperCase().endsWith(quote)) {
        const base = symbol.slice(0, -quote.length).toUpperCase();
        return `${base}-${quote}`;
      }
    }
    
    if (symbol.length > 4) {
      const base = symbol.slice(0, -4).toUpperCase();
      const quote = symbol.slice(-4).toUpperCase();
      return `${base}-${quote}`;
    }
    
    return symbol.toUpperCase();
  }

  async connect(symbol: string = 'btcusdt'): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Get WebSocket connection info from KuCoin
        const wsInfo = await this.getWebSocketInfo();
        this.token = wsInfo.token;
        this.instanceServers = wsInfo.instanceServers;

        if (!this.instanceServers.length) {
          throw new Error('No WebSocket servers available');
        }

        const server = this.instanceServers[0];
        const url = `${server.endpoint}?token=${this.token}&acceptUserMessage=true`;
        
        console.log('Attempting KuCoin WebSocket connection to:', url);
        this.ws = new WebSocket(url);

        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket connection timeout, falling back to mock data');
            this.ws.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          console.log('KuCoin WebSocket connected successfully');
          clearTimeout(timeout);
          this.reconnectAttempts = 0;
          
          // Subscribe to orderbook for the symbol
          const formattedSymbol = this.formatSymbol(symbol);
          const subscribeMessage = {
            id: Date.now(),
            type: 'subscribe',
            topic: `/market/level2:${formattedSymbol}`,
            privateChannel: false,
            response: true
          };
          
          this.ws!.send(JSON.stringify(subscribeMessage));
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'message' && message.topic && message.topic.includes('/market/level2:')) {
              // Transform KuCoin data to Binance format for compatibility
              const kucoinData = message as KuCoinWebSocketOrderbook;
              const transformedData: WebSocketOrderbook = {
                e: 'depthUpdate',
                E: Date.now(),
                s: kucoinData.data.symbol.replace('-', ''),
                U: kucoinData.data.sequenceStart,
                u: kucoinData.data.sequenceEnd,
                b: kucoinData.data.changes.bids.map(([price, quantity]) => [price, quantity]),
                a: kucoinData.data.changes.asks.map(([price, quantity]) => [price, quantity])
              };
              
              this.notifySubscribers('orderbook', transformedData);
            }
          } catch (error) {
            console.error('Error parsing KuCoin WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('KuCoin WebSocket disconnected:', event.code, event.reason);
          clearTimeout(timeout);
          this.handleReconnect(symbol);
        };

        this.ws.onerror = (error) => {
          console.error('KuCoin WebSocket error:', error);
          clearTimeout(timeout);
          reject(error);
        };
      } catch (error) {
        console.error('Failed to create KuCoin WebSocket:', error);
        reject(error);
      }
    });
  }

  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    
    this.subscribers.get(channel)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(channel);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    };
  }

  private notifySubscribers(channel: string, data: any) {
    const callbacks = this.subscribers.get(channel);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  private handleReconnect(symbol: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(symbol).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }
}

export const websocketService = new WebSocketService();