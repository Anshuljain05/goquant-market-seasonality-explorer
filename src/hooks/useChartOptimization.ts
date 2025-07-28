import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsMobile } from './use-mobile';

interface ChartOptimizationOptions {
  maxDataPoints?: number;
  updateThrottle?: number;
  enableVirtualization?: boolean;
  memoryThreshold?: number;
}

interface OptimizedData<T> {
  data: T[];
  isVirtualized: boolean;
  startIndex: number;
  endIndex: number;
  totalPoints: number;
  updateVisibleRange: (start: number, end: number) => void;
  panToRange: (centerIndex: number, rangeSize?: number) => void;
  zoomToRange: (startIndex: number, endIndex: number) => void;
  resetView: () => void;
  getPerformanceMetrics: () => any;
  measurePerformance: <R>(operation: () => R, operationType: 'render' | 'dataProcess') => R;
}

const defaultOptions: ChartOptimizationOptions = {
  maxDataPoints: 1000,
  updateThrottle: 100,
  enableVirtualization: true,
  memoryThreshold: 50 * 1024 * 1024 // 50MB
};

export const useChartOptimization = <T>(
  originalData: T[],
  options: ChartOptimizationOptions = {}
): OptimizedData<T> => {
  const opts = { ...defaultOptions, ...options };
  const isMobile = useIsMobile();
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: opts.maxDataPoints! });
  const lastUpdateTime = useRef<number>(0);
  const memoryUsage = useRef<number>(0);

  // Adjust optimization based on device capabilities
  const optimizedMaxPoints = useMemo(() => {
    if (isMobile) {
      return Math.min(opts.maxDataPoints! * 0.6, 500); // Reduce by 40% on mobile
    }
    return opts.maxDataPoints!;
  }, [isMobile, opts.maxDataPoints]);

  // Memory usage estimation
  const estimateMemoryUsage = useCallback((data: T[]): number => {
    // Rough estimation: each data point is approximately 200 bytes
    return data.length * 200;
  }, []);

  // Data virtualization
  const virtualizeData = useCallback((
    data: T[],
    startIndex: number = 0,
    maxPoints: number = optimizedMaxPoints
  ): T[] => {
    if (!opts.enableVirtualization || data.length <= maxPoints) {
      return data;
    }

    const endIndex = Math.min(startIndex + maxPoints, data.length);
    return data.slice(startIndex, endIndex);
  }, [opts.enableVirtualization, optimizedMaxPoints]);

  // Data sampling for large datasets
  const sampleData = useCallback((data: T[], targetCount: number): T[] => {
    if (data.length <= targetCount) {
      return data;
    }

    const step = data.length / targetCount;
    const sampled: T[] = [];
    
    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step);
      sampled.push(data[index]);
    }

    return sampled;
  }, []);

  // Throttled data updates
  const throttledUpdate = useCallback((
    updateFn: () => void,
    throttleMs: number = opts.updateThrottle!
  ) => {
    const now = Date.now();
    if (now - lastUpdateTime.current >= throttleMs) {
      updateFn();
      lastUpdateTime.current = now;
    }
  }, [opts.updateThrottle]);

  // Memory management
  const checkMemoryUsage = useCallback(() => {
    const currentUsage = estimateMemoryUsage(originalData);
    memoryUsage.current = currentUsage;

    if (currentUsage > opts.memoryThreshold!) {
      // Trigger garbage collection hint (if available)
      if ('gc' in window && typeof window.gc === 'function') {
        window.gc();
      }
      
      // Reduce visible data points
      const reductionFactor = Math.min(0.8, opts.memoryThreshold! / currentUsage);
      const newMaxPoints = Math.floor(optimizedMaxPoints * reductionFactor);
      
      setVisibleRange(prev => ({
        start: prev.start,
        end: Math.min(prev.start + newMaxPoints, originalData.length)
      }));
    }
  }, [originalData, estimateMemoryUsage, opts.memoryThreshold, optimizedMaxPoints]);

  // Performance monitoring
  const performanceRef = useRef({
    renderTime: 0,
    dataProcessTime: 0,
    updateCount: 0
  });

  const measurePerformance = useCallback(<R>(
    operation: () => R,
    operationType: 'render' | 'dataProcess'
  ): R => {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;
    
    performanceRef.current[`${operationType}Time`] = duration;
    performanceRef.current.updateCount++;
    
    return result;
  }, []);

  // Optimized data processing
  const processedData = useMemo(() => {
    return measurePerformance(() => {
      // Check memory usage periodically
      if (performanceRef.current.updateCount % 10 === 0) {
        checkMemoryUsage();
      }

      let data = originalData;
      
      // Apply sampling if data is too large
      if (data.length > optimizedMaxPoints * 2) {
        data = sampleData(data, optimizedMaxPoints);
      }
      
      // Apply virtualization
      const virtualizedData = virtualizeData(
        data, 
        visibleRange.start, 
        visibleRange.end - visibleRange.start
      );

      return {
        data: virtualizedData,
        isVirtualized: data.length > optimizedMaxPoints,
        startIndex: visibleRange.start,
        endIndex: Math.min(visibleRange.end, data.length),
        totalPoints: originalData.length
      };
    }, 'dataProcess');
  }, [
    originalData,
    optimizedMaxPoints,
    visibleRange,
    virtualizeData,
    sampleData,
    measurePerformance,
    checkMemoryUsage
  ]);

  // Update visible range
  const updateVisibleRange = useCallback((start: number, end: number) => {
    throttledUpdate(() => {
      setVisibleRange({
        start: Math.max(0, start),
        end: Math.min(originalData.length, end)
      });
    });
  }, [originalData.length, throttledUpdate]);

  // Pan to specific data range
  const panToRange = useCallback((centerIndex: number, rangeSize: number = optimizedMaxPoints) => {
    const halfRange = Math.floor(rangeSize / 2);
    const start = Math.max(0, centerIndex - halfRange);
    const end = Math.min(originalData.length, start + rangeSize);
    
    updateVisibleRange(start, end);
  }, [originalData.length, optimizedMaxPoints, updateVisibleRange]);

  // Zoom functionality
  const zoomToRange = useCallback((startIndex: number, endIndex: number) => {
    updateVisibleRange(startIndex, endIndex);
  }, [updateVisibleRange]);

  // Reset to full data view
  const resetView = useCallback(() => {
    setVisibleRange({ start: 0, end: optimizedMaxPoints });
  }, [optimizedMaxPoints]);

  // Performance metrics
  const getPerformanceMetrics = useCallback(() => ({
    ...performanceRef.current,
    memoryUsage: memoryUsage.current,
    dataReduction: ((originalData.length - processedData.data.length) / originalData.length) * 100,
    isOptimized: processedData.isVirtualized || originalData.length !== processedData.data.length
  }), [originalData.length, processedData]);

  // Auto-optimization based on performance
  useEffect(() => {
    if (performanceRef.current.renderTime > 100) { // If rendering takes more than 100ms
      const reductionFactor = Math.max(0.5, 100 / performanceRef.current.renderTime);
      const newMaxPoints = Math.floor(optimizedMaxPoints * reductionFactor);
      
      setVisibleRange(prev => ({
        start: prev.start,
        end: Math.min(prev.start + newMaxPoints, originalData.length)
      }));
    }
  }, [performanceRef.current.renderTime, optimizedMaxPoints, originalData.length]);

  return {
    ...processedData,
    updateVisibleRange,
    panToRange,
    zoomToRange,
    resetView,
    getPerformanceMetrics,
    measurePerformance
  };
};

// Hook for chart data streaming optimization
export const useChartStreaming = <T>(
  onNewData: (data: T) => void,
  bufferSize: number = 1000
) => {
  const [buffer, setBuffer] = useState<T[]>([]);
  const isMobile = useIsMobile();
  const updateIntervalRef = useRef<NodeJS.Timeout>();
  
  // Adjust update frequency based on device
  const updateInterval = isMobile ? 500 : 100; // Less frequent updates on mobile

  const addToBuffer = useCallback((newData: T) => {
    setBuffer(prev => {
      const updated = [...prev, newData];
      // Keep buffer size manageable
      if (updated.length > bufferSize) {
        return updated.slice(-bufferSize);
      }
      return updated;
    });
  }, [bufferSize]);

  const flushBuffer = useCallback(() => {
    if (buffer.length > 0) {
      buffer.forEach(onNewData);
      setBuffer([]);
    }
  }, [buffer, onNewData]);

  // Periodic buffer flush
  useEffect(() => {
    updateIntervalRef.current = setInterval(flushBuffer, updateInterval);
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [flushBuffer, updateInterval]);

  return {
    addToBuffer,
    flushBuffer,
    bufferSize: buffer.length,
    clearBuffer: () => setBuffer([])
  };
};
