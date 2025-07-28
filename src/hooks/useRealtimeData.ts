import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiManager, APISource } from '@/services/api-manager';
import { enhancedWebSocketService } from '@/services/enhanced-websocket';
import { Orderbook, Ticker24h, FinancialData, WebSocketOrderbook } from '@/types/api';

export function useRealtimeData(symbol: string = 'BTCUSDT', onSourceChange?: (source: string) => void) {
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [apiSource, setApiSource] = useState<APISource>('coinbase');

  // Manual source switching
  const switchSource = async (source: string) => {
    await apiManager.forceSwitch(source as APISource);
    setApiSource(source as APISource);
    onSourceChange?.(source);
  };

  const testConnection = async (source: APISource): Promise<void> => {
    await apiManager.testConnection(source);
  };

  const refreshHealthStatus = async () => {
    await apiManager.refreshHealthStatus();
  };

  // Fetch 24h ticker data
  const { data: ticker, isLoading: tickerLoading, refetch: refetchTicker } = useQuery({
    queryKey: ['ticker', symbol, apiSource],
    queryFn: async () => {
      const result = await apiManager.get24hTicker(symbol);
      setApiSource(result.source);
      return result;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch historical klines data
  const { data: klines, isLoading: klinesLoading, refetch: refetchKlines } = useQuery({
    queryKey: ['klines', symbol, apiSource],
    queryFn: async () => {
      const result = await apiManager.getKlines(symbol, '1day', 30);
      setApiSource(result.source);
      return result;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Initial orderbook fetch
  const { data: initialOrderbook, refetch: refetchOrderbook } = useQuery({
    queryKey: ['orderbook', symbol, apiSource],
    queryFn: async () => {
      const result = await apiManager.getOrderbook(symbol);
      setApiSource(result.source);
      return result;
    },
    refetchInterval: 5000, // Fallback refresh every 5 seconds
  });

  // WebSocket connection for real-time orderbook
  useEffect(() => {
    let mounted = true;
    let unsubscribeFunction: (() => void) | null = null;

    const connectWebSocket = async () => {
      if (!mounted) return;
      
      try {
        setConnectionStatus('connecting');
        await enhancedWebSocketService.connect(symbol.toLowerCase());
        
        if (!mounted) return;
        
        setConnectionStatus('connected');

        unsubscribeFunction = enhancedWebSocketService.subscribe('orderbook', (data: Orderbook) => {
          if (!mounted) return;
          
          // Data is already in Orderbook format from enhanced service
          setOrderbook(data);
        });

      } catch (error) {
        console.error('WebSocket connection failed:', error);
        if (mounted) {
          setConnectionStatus('error');
          // Use initial orderbook as fallback
          if (initialOrderbook) {
            setOrderbook(initialOrderbook);
          }
        }
      }
    };

    // Start connection attempt
    connectWebSocket();

    return () => {
      mounted = false;
      if (unsubscribeFunction) {
        unsubscribeFunction();
      }
      enhancedWebSocketService.disconnect();
    };
  }, [symbol, initialOrderbook]);

  // Update connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = enhancedWebSocketService.getConnectionStatus();
      setConnectionStatus(status);
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Transform data to FinancialData format
  useEffect(() => {
    if (ticker && klines) {
      const transformed = apiManager.transformToFinancialData(ticker, klines);
      setFinancialData(transformed);
    }
  }, [ticker, klines]);

  // Update switchSource to trigger refetches
  const switchSourceWithRefetch = async (source: string) => {
    await switchSource(source);
    // Refetch all data with new source
    refetchTicker();
    refetchKlines();
    refetchOrderbook();
  };

  return {
    orderbook: orderbook || initialOrderbook,
    ticker,
    klines,
    financialData,
    connectionStatus,
    isLoading: tickerLoading || klinesLoading,
    symbol,
    apiSource,
    apiHealth: apiManager.getAPIHealth(),
    switchSource: switchSourceWithRefetch,
    testConnection,
    refreshHealthStatus
  };
}