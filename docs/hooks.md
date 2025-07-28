# Custom Hooks Documentation

## UI Hooks

### `useMobile` (`use-mobile.tsx`)
Hook for responsive design and mobile detection:

```typescript
const useMobile = (): boolean => {
  // Returns true if the current viewport is mobile
}
```

### `useBreakpoint` (`useBreakpoint.ts`)
Hook for responsive breakpoint detection:

```typescript
interface Breakpoints {
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
}

const useBreakpoint = (): Breakpoints
```

### `useTouch` (`useTouch.ts`)
Hook for touch interaction handling:

```typescript
interface TouchHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

const useTouch = (options?: TouchOptions): TouchHandlers
```

## Data Hooks

### `useRealtimeData` (`useRealtimeData.ts`)
Hook for managing real-time data streams:

```typescript
interface RealtimeDataOptions {
  symbol: string;
  interval: string;
  exchange: string;
}

interface RealtimeData {
  data: MarketData;
  isLoading: boolean;
  error: Error | null;
  subscribe: () => void;
  unsubscribe: () => void;
}

const useRealtimeData = (options: RealtimeDataOptions): RealtimeData
```

### `useChartOptimization` (`useChartOptimization.ts`)
Hook for optimizing chart performance:

```typescript
interface OptimizationOptions {
  data: any[];
  threshold: number;
  samplingRate: number;
}

const useChartOptimization = (options: OptimizationOptions): OptimizedData
```

## WebSocket Hooks

### `useWebSocketHealth` (`useWebSocketHealth.ts`)
Hook for monitoring WebSocket connection health:

```typescript
interface WebSocketHealth {
  isConnected: boolean;
  latency: number;
  errors: Error[];
  reconnect: () => void;
}

const useWebSocketHealth = (url: string): WebSocketHealth
```

## Toast Notifications

### `useToast` (`use-toast.ts`)
Hook for managing toast notifications:

```typescript
interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

interface ToastAPI {
  toast: (options: ToastOptions) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const useToast = (): ToastAPI
```

## Best Practices

### State Management
- Use appropriate state initialization
- Handle side effects properly
- Clean up resources when unmounting

### Performance
- Memoize callbacks and values
- Avoid unnecessary re-renders
- Optimize dependencies array

### Error Handling
- Proper error boundaries
- Fallback values
- Loading states

### TypeScript Integration
- Strong typing for parameters
- Return type definitions
- Generic type support

## Example Usage

```typescript
// Using useRealtimeData
const MyComponent = () => {
  const { data, isLoading, error } = useRealtimeData({
    symbol: 'BTC-USD',
    interval: '1m',
    exchange: 'binance'
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <Chart data={data} />;
};

// Using useToast
const NotificationComponent = () => {
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: 'Success',
      description: 'Operation completed successfully',
      type: 'success'
    });
  };

  return <Button onClick={handleAction}>Perform Action</Button>;
};
```
