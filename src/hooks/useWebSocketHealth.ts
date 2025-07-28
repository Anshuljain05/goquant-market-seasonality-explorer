import { useState, useEffect, useCallback } from 'react';
import { enhancedWebSocketService } from '@/services/enhanced-websocket';

interface WebSocketMetrics {
  connectionCount: number;
  totalMessages: number;
  messageRate: number; // messages per second
  lastMessageTime: number;
  uptime: number;
  reconnectCount: number;
  errorCount: number;
  latency?: number;
}

interface ConnectionQuality {
  status: 'excellent' | 'good' | 'poor' | 'disconnected';
  score: number; // 0-100
  issues: string[];
}

export function useWebSocketHealth(symbol?: string) {
  const [metrics, setMetrics] = useState<WebSocketMetrics>({
    connectionCount: 0,
    totalMessages: 0,
    messageRate: 0,
    lastMessageTime: 0,
    uptime: 0,
    reconnectCount: 0,
    errorCount: 0
  });

  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>({
    status: 'disconnected',
    score: 0,
    issues: []
  });

  const [isHealthy, setIsHealthy] = useState(false);

  // Track message counts and timing
  useEffect(() => {
    let messageCount = 0;
    let startTime = Date.now();
    let lastMessageTime = 0;
    const messageTimestamps: number[] = [];

    const unsubscribe = enhancedWebSocketService.subscribe('orderbook', () => {
      messageCount++;
      const now = Date.now();
      lastMessageTime = now;
      messageTimestamps.push(now);

      // Keep only last 60 seconds of timestamps for rate calculation
      const oneMinuteAgo = now - 60000;
      while (messageTimestamps.length > 0 && messageTimestamps[0] < oneMinuteAgo) {
        messageTimestamps.shift();
      }

      const messageRate = messageTimestamps.length / 60; // messages per second
      const uptime = now - startTime;

      setMetrics(prev => ({
        ...prev,
        totalMessages: messageCount,
        messageRate,
        lastMessageTime,
        uptime
      }));
    });

    return unsubscribe;
  }, []);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = enhancedWebSocketService.getConnectionStatus();
      const connectionCount = status === 'connected' ? 1 : 0;
      
      setMetrics(prev => ({
        ...prev,
        connectionCount
      }));

      setIsHealthy(status === 'connected');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate connection quality
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastMessage = now - metrics.lastMessageTime;
    const isConnected = enhancedWebSocketService.getConnectionStatus() === 'connected';
    
    let score = 0;
    let status: ConnectionQuality['status'] = 'disconnected';
    const issues: string[] = [];

    if (!isConnected) {
      status = 'disconnected';
      score = 0;
      issues.push('Not connected to WebSocket');
    } else {
      score = 100;

      // Deduct points for various issues
      if (timeSinceLastMessage > 10000) {
        score -= 30;
        issues.push('No recent messages (>10s)');
      } else if (timeSinceLastMessage > 5000) {
        score -= 15;
        issues.push('Slow message updates (>5s)');
      }

      if (metrics.messageRate < 0.1) {
        score -= 20;
        issues.push('Low message rate');
      }

      if (metrics.reconnectCount > 3) {
        score -= 25;
        issues.push('Frequent reconnections');
      }

      if (metrics.errorCount > 5) {
        score -= 20;
        issues.push('High error count');
      }

      if (metrics.latency && metrics.latency > 1000) {
        score -= 15;
        issues.push('High latency');
      }

      // Determine status based on score
      if (score >= 80) {
        status = 'excellent';
      } else if (score >= 60) {
        status = 'good';
      } else {
        status = 'poor';
      }
    }

    setConnectionQuality({
      status,
      score: Math.max(0, score),
      issues
    });
  }, [metrics]);

  // Test connection latency
  const testLatency = useCallback(async () => {
    const start = Date.now();
    try {
      // In a real implementation, you'd send a ping message and wait for pong
      // For now, we'll simulate with a connection status check
      await new Promise(resolve => setTimeout(resolve, 10));
      const latency = Date.now() - start;
      setMetrics(prev => ({ ...prev, latency }));
      return latency;
    } catch (error) {
      setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
      return -1;
    }
  }, []);

  // Force reconnection
  const forceReconnect = useCallback(async () => {
    try {
      enhancedWebSocketService.disconnect();
      if (symbol) {
        await enhancedWebSocketService.connect(symbol.toLowerCase());
        setMetrics(prev => ({ 
          ...prev, 
          reconnectCount: prev.reconnectCount + 1 
        }));
      }
    } catch (error) {
      setMetrics(prev => ({ 
        ...prev, 
        errorCount: prev.errorCount + 1 
      }));
    }
  }, [symbol]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      connectionCount: 0,
      totalMessages: 0,
      messageRate: 0,
      lastMessageTime: 0,
      uptime: 0,
      reconnectCount: 0,
      errorCount: 0
    });
  }, []);

  return {
    metrics,
    connectionQuality,
    isHealthy,
    testLatency,
    forceReconnect,
    resetMetrics
  };
}
