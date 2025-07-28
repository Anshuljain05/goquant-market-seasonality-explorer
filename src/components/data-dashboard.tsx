import React, { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Activity, DollarSign, PieChart, AlertTriangle, Calendar, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useWebSocketHealth } from '@/hooks/useWebSocketHealth';
import { OrderbookChart } from '@/components/charts/OrderbookChart';
import { CandlestickChart } from '@/components/charts/CandlestickChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { DepthChart } from '@/components/charts/DepthChart';
import { DateRange } from './interactive-features/date-range-selector';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { PriceTicker } from '@/components/ui/price-ticker';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { TooltipProvider } from '@/components/ui/tooltip';
import { APIStatusButtons } from '@/components/ui/api-status-buttons';
import { SymbolInfo } from '@/components/ui/symbol-info';
import { OrderbookEnhancements } from '@/components/ui/orderbook-enhancements';

interface DataDashboardProps {
  selectedDate: Date | null;
  data?: any;
  dateRange?: DateRange;
  viewType?: 'day' | 'week' | 'month';
}

// Generate mock analysis data for the selected range
const generateRangeAnalysis = (dateRange: DateRange) => {
  if (!dateRange.start || !dateRange.end) return null;
  
  const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const seed = dateRange.start.getTime() + dateRange.end.getTime();
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * 9.301) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };
  
  const avgVolatility = random(0.1, 0.8);
  const totalVolume = random(100000000, 500000000) * days;
  const overallPerformance = random(-0.3, 0.3);
  
  return {
    days,
    avgVolatility,
    totalVolume,
    overallPerformance,
    highVolatilityDays: Math.floor(days * (avgVolatility > 0.6 ? 0.4 : avgVolatility > 0.3 ? 0.2 : 0.1)),
    bestDay: overallPerformance > 0 ? random(0.05, 0.15) : random(0.01, 0.05),
    worstDay: overallPerformance < 0 ? -random(0.05, 0.15) : -random(0.01, 0.05),
    avgPrice: random(40000, 70000),
    priceRange: { min: random(35000, 50000), max: random(60000, 75000) },
    avgLiquidity: random(0.3, 0.9),
  };
};

export const DataDashboard: React.FC<DataDashboardProps> = ({ selectedDate, data, dateRange, viewType = 'day' }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [activeTab, setActiveTab] = useState<'overview' | 'charts'>('overview');
  const [previousOrderbook, setPreviousOrderbook] = useState(null);
  const [keyPressed, setKeyPressed] = useState<string | null>(null);
  
  // Real-time data integration
  const {
    orderbook,
    ticker,
    klines,
    financialData,
    connectionStatus,
    isLoading,
    apiSource,
    apiHealth,
    switchSource,
    testConnection,
    refreshHealthStatus
  } = useRealtimeData(selectedSymbol);

  const { 
    metrics, 
    connectionQuality, 
    isHealthy,
    testLatency,
    forceReconnect,
    resetMetrics 
  } = useWebSocketHealth();

  // Track orderbook changes for enhancements
  React.useEffect(() => {
    if (orderbook) {
      setPreviousOrderbook(prevOrderbook => prevOrderbook);
      setPreviousOrderbook(orderbook);
    }
  }, [orderbook]);

  // Keyboard navigation for O (overview) and L (live/charts)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if no input/textarea is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'o') {
        setActiveTab('overview');
        setKeyPressed('O');
        setTimeout(() => setKeyPressed(null), 200);
        event.preventDefault();
      } else if (key === 'l') {
        setActiveTab('charts');
        setKeyPressed('L');
        setTimeout(() => setKeyPressed(null), 200);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Enhanced error handling
  const hasConnectionError = connectionStatus === 'error' || connectionStatus === 'disconnected';
  const hasDataError = !isLoading && !ticker && !financialData.length;
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getPerformanceIcon = (performance: number) => {
    if (performance > 0.02) return <TrendingUp className="w-5 h-5 text-performance-positive" />;
    if (performance < -0.02) return <TrendingDown className="w-5 h-5 text-performance-negative" />;
    return <BarChart3 className="w-5 h-5 text-performance-neutral" />;
  };

  const getVolatilityLevel = (volatility: number) => {
    if (volatility < 0.3) return 'Low';
    if (volatility < 0.7) return 'Medium';
    return 'High';
  };

  // Check if we have a complete date range for range analysis
  const hasCompleteRange = dateRange?.start && dateRange?.end;
  const rangeAnalysis = hasCompleteRange ? generateRangeAnalysis(dateRange) : null;

  // Show analysis for week/month selections even without date range
  const shouldShowAnalysis = selectedDate || hasCompleteRange;

  if (!shouldShowAnalysis) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a date, week, month, or date range to view detailed financial metrics</p>
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full mx-auto space-y-4 sm:space-y-6">
        {/* API Source Selection */}
        <Card className="p-4">
          <APIStatusButtons
            currentSource={apiSource as any}
            apiHealth={apiHealth}
            onSourceChange={switchSource}
            onTestConnection={testConnection}
            onRefreshAll={refreshHealthStatus}
          />
        </Card>

        {/* Real-time Price Ticker */}
        {ticker && (
          <div className="animate-fade-in">
            <PriceTicker
              price={parseFloat(ticker.lastPrice)}
              change={parseFloat(ticker.priceChange)}
              changePercent={parseFloat(ticker.priceChangePercent)}
              symbol={selectedSymbol}
              className="transition-all duration-500 hover:shadow-lg"
            />
          </div>
        )}

        {/* Header */}
        <Card className="p-4 sm:p-6 transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              {hasCompleteRange ? 'Date Range Analysis' : 
               viewType === 'week' ? 'Weekly Analysis' :
               viewType === 'month' ? 'Monthly Analysis' : 'Market Analysis'}
            </h2>
            {hasCompleteRange ? (
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Range: {dateRange!.start!.toLocaleDateString()} - {dateRange!.end!.toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Duration: {rangeAnalysis?.days} days
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Selected {viewType === 'day' ? 'Date' : viewType === 'week' ? 'Week' : 'Month'}: {selectedDate?.toLocaleDateString('en-US', { 
                  weekday: viewType === 'day' ? 'long' : undefined,
                  year: 'numeric', 
                  month: 'long', 
                  day: viewType === 'day' ? 'numeric' : undefined
                })}
                {viewType === 'week' && (
                  <span className="ml-2 text-sm">
                    ({new Date(selectedDate!.getTime() - selectedDate!.getDay() * 24 * 60 * 60 * 1000).toLocaleDateString()} - {new Date(selectedDate!.getTime() + (6 - selectedDate!.getDay()) * 24 * 60 * 60 * 1000).toLocaleDateString()})
                  </span>
                )}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <div className="w-4 h-4 sm:w-5 sm:h-5">
              {getPerformanceIcon(hasCompleteRange ? (rangeAnalysis?.overallPerformance || 0) : (data?.performance || 0))}
            </div>
            <span className={cn(
              "text-base sm:text-lg font-semibold",
              (hasCompleteRange ? (rangeAnalysis?.overallPerformance || 0) : (data?.performance || 0)) > 0 ? "text-performance-positive" : 
              (hasCompleteRange ? (rangeAnalysis?.overallPerformance || 0) : (data?.performance || 0)) < 0 ? "text-performance-negative" : "text-performance-neutral"
            )}>
              {((hasCompleteRange ? (rangeAnalysis?.overallPerformance || 0) : (data?.performance || 0)) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Price Card */}
        <Card className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-sm sm:text-base truncate">{hasCompleteRange ? 'Avg Price' : 'Price'}</h3>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            ${formatCurrency(hasCompleteRange ? (rangeAnalysis?.avgPrice || 0) : (data?.price || 0))}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {hasCompleteRange ? `$${formatCurrency(rangeAnalysis?.priceRange?.min || 0)} - $${formatCurrency(rangeAnalysis?.priceRange?.max || 0)}` : 'Current BTC Price'}
          </p>
        </Card>

        {/* Volume Card */}
        <Card className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-sm sm:text-base truncate">{hasCompleteRange ? 'Total Vol' : 'Volume'}</h3>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {formatVolume(hasCompleteRange ? (rangeAnalysis?.totalVolume || 0) : (data?.volume || 0))}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {hasCompleteRange ? `Avg: ${formatVolume((rangeAnalysis?.totalVolume || 0) / (rangeAnalysis?.days || 1))}/day` : '24h Trading'}
          </p>
        </Card>

        {/* Volatility Card */}
        <Card className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-sm sm:text-base truncate">{hasCompleteRange ? 'Avg Volatility' : 'Volatility'}</h3>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {((hasCompleteRange ? (rangeAnalysis?.avgVolatility || 0) : (data?.volatility || 0)) * 100).toFixed(1)}%
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={
              (hasCompleteRange ? (rangeAnalysis?.avgVolatility || 0) : (data?.volatility || 0)) > 0.7 ? "destructive" : 
              (hasCompleteRange ? (rangeAnalysis?.avgVolatility || 0) : (data?.volatility || 0)) > 0.3 ? "default" : "secondary"
            } className="text-xs">
              {getVolatilityLevel(hasCompleteRange ? (rangeAnalysis?.avgVolatility || 0) : (data?.volatility || 0))}
            </Badge>
          </div>
          {hasCompleteRange && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {rangeAnalysis?.highVolatilityDays} high vol days
            </p>
          )}
        </Card>

        {/* Liquidity Card */}
        <Card className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-sm sm:text-base truncate">Liquidity</h3>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {((hasCompleteRange ? (rangeAnalysis?.avgLiquidity || 0) : (data?.liquidity || 0)) * 100).toFixed(1)}%
          </div>
          <Progress 
            value={(hasCompleteRange ? (rangeAnalysis?.avgLiquidity || 0) : (data?.liquidity || 0)) * 100} 
            className="mt-2 h-1.5 sm:h-2"
          />
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 truncate">
            {hasCompleteRange ? 'Avg Market Depth' : 'Market Depth'}
          </p>
        </Card>
      </div>

      {hasCompleteRange && rangeAnalysis && (
        /* Range-specific analysis */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Best/Worst Performance */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 text-primary mr-2" />
              Performance Extremes
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Best Day:</span>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-performance-positive" />
                  <span className="font-semibold text-performance-positive">
                    +{(rangeAnalysis.bestDay * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Worst Day:</span>
                <div className="flex items-center space-x-1">
                  <TrendingDown className="w-4 h-4 text-performance-negative" />
                  <span className="font-semibold text-performance-negative">
                    {(rangeAnalysis.worstDay * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Range:</span>
                  <span className="font-semibold">
                    {((rangeAnalysis.bestDay - rangeAnalysis.worstDay) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Risk Analysis */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-primary mr-2" />
              Risk Assessment
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Volatility Risk</span>
                  <span className="text-sm font-medium">
                    {rangeAnalysis.avgVolatility > 0.6 ? "High" : rangeAnalysis.avgVolatility > 0.3 ? "Medium" : "Low"}
                  </span>
                </div>
                <Progress 
                  value={rangeAnalysis.avgVolatility * 100}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Performance Consistency</span>
                  <span className="text-sm font-medium">
                    {Math.abs(rangeAnalysis.overallPerformance) < 0.05 ? "Stable" : "Volatile"}
                  </span>
                </div>
                <Progress 
                  value={Math.max(0, 100 - Math.abs(rangeAnalysis.overallPerformance) * 1000)}
                  className="h-2"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Market Summary - Only show for single date selection */}
      {!hasCompleteRange && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Market Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Opening Price</span>
                <span className="font-medium">${formatCurrency(data.price * (1 - data.performance))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Closing Price</span>
                <span className="font-medium">${formatCurrency(data.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Day High</span>
                <span className="font-medium">${formatCurrency(data.price * (1 + Math.abs(data.performance) * 1.5))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Day Low</span>
                <span className="font-medium">${formatCurrency(data.price * (1 - Math.abs(data.performance) * 1.2))}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Technical Indicators</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">RSI (14)</span>
                <span className="font-medium">{(50 + data.performance * 100).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Moving Avg (20)</span>
                <span className="font-medium">${formatCurrency(data.price * 0.98)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Support Level</span>
                <span className="font-medium">${formatCurrency(data.price * 0.95)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Resistance Level</span>
                <span className="font-medium">${formatCurrency(data.price * 1.05)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Real-time Data Controls */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                <SelectItem value="ADAUSDT">ADA/USDT</SelectItem>
                <SelectItem value="DOTUSDT">DOT/USDT</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Keyboard Navigation Box */}
            <div className="flex items-center space-x-2 bg-muted/50 rounded-lg px-3 py-2">
              <span className="text-sm text-muted-foreground">Navigation:</span>
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 text-xs bg-background rounded border shadow-sm">
                  O
                </kbd>
                <span className="text-xs text-muted-foreground">Overview</span>
                <kbd className="px-2 py-1 text-xs bg-background rounded border shadow-sm">
                  L
                </kbd>
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            </div>
            
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
              className={cn(
                connectionStatus === 'connected' ? 'bg-green-600 text-white' :
                connectionStatus === 'connecting' ? 'bg-yellow-600 text-white' :
                connectionStatus === 'error' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white',
                "flex items-center space-x-1"
              )}
            >
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>Live Data</span>
                </>
              ) : connectionStatus === 'connecting' ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Mock Data</span>
                </>
              )}
            </Badge>
          </div>
          
          <div className="flex space-x-1 p-1 bg-muted rounded-lg">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-all duration-200",
                activeTab === 'overview' && "bg-primary text-primary-foreground shadow-sm",
                keyPressed === 'O' && "ring-2 ring-ring",
                activeTab !== 'overview' && "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              Overview <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded border">O</kbd>
            </Button>
            <Button
              variant={activeTab === 'charts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('charts')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-all duration-200",
                activeTab === 'charts' && "bg-primary text-primary-foreground shadow-sm",
                keyPressed === 'L' && "ring-2 ring-ring",
                activeTab !== 'charts' && "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              Live Charts <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded border">L</kbd>
            </Button>
          </div>
        </div>
      </Card>

      {/* Overview Tab - Summary & Analysis */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Risk Analysis - Only show for single date selection */}
          {!hasCompleteRange && data && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Risk Analysis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center p-4 border border-border rounded-lg">
                  <div className={cn(
                    "text-2xl font-bold mb-1",
                    data.volatility < 0.3 ? "text-volatility-low" : 
                    data.volatility < 0.7 ? "text-volatility-medium" : "text-volatility-high"
                  )}>
                    {data.volatility < 0.3 ? 'LOW' : data.volatility < 0.7 ? 'MEDIUM' : 'HIGH'}
                  </div>
                  <p className="text-sm text-muted-foreground">Volatility Risk</p>
                </div>
                <div className="text-center p-4 border border-border rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {data.liquidity > 0.7 ? 'HIGH' : data.liquidity > 0.4 ? 'MEDIUM' : 'LOW'}
                  </div>
                  <p className="text-sm text-muted-foreground">Liquidity Level</p>
                </div>
                <div className="text-center p-4 border border-border rounded-lg">
                  <div className={cn(
                    "text-2xl font-bold mb-1",
                    Math.abs(data.performance) > 0.1 ? "text-performance-negative" :
                    Math.abs(data.performance) > 0.05 ? "text-volatility-medium" : "text-performance-positive"
                  )}>
                    {Math.abs(data.performance) > 0.1 ? 'HIGH' : Math.abs(data.performance) > 0.05 ? 'MEDIUM' : 'LOW'}
                  </div>
                  <p className="text-sm text-muted-foreground">Price Risk</p>
                </div>
              </div>
            </Card>
          )}

          {/* Market Summary & Technical Indicators for all dates */}
          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Market Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Opening Price</span>
                    <span className="font-medium">${formatCurrency(data.price * (1 - data.performance))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Closing Price</span>
                    <span className="font-medium">${formatCurrency(data.price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Day High</span>
                    <span className="font-medium">${formatCurrency(data.price * (1 + Math.abs(data.performance) * 1.5))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Day Low</span>
                    <span className="font-medium">${formatCurrency(data.price * (1 - Math.abs(data.performance) * 1.2))}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Technical Indicators</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">RSI (14)</span>
                    <span className="font-medium">{(50 + data.performance * 100).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Moving Avg (20)</span>
                    <span className="font-medium">${formatCurrency(data.price * 0.98)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Support Level</span>
                    <span className="font-medium">${formatCurrency(data.price * 0.95)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Resistance Level</span>
                    <span className="font-medium">${formatCurrency(data.price * 1.05)}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Current Market Status with Live Price */}
          {ticker && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 text-primary mr-2" />
                Current Market Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Live Price</p>
                  <p className="text-lg font-bold">${parseFloat(ticker.lastPrice).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">24h Change</p>
                  <p className={cn(
                    "text-lg font-bold",
                    parseFloat(ticker.priceChangePercent) > 0 ? "text-performance-positive" : "text-performance-negative"
                  )}>
                    {parseFloat(ticker.priceChangePercent) > 0 ? '+' : ''}{parseFloat(ticker.priceChangePercent).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <p className="text-lg font-bold">{formatVolume(parseFloat(ticker.volume))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Market Status</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-performance-positive rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Live</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Live Charts Tab - Real-time Data & Charts */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Header with Symbol Info and WebSocket Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Symbol Information */}
            <div className="lg:col-span-2">
              {ticker && (
                <SymbolInfo
                  symbol={selectedSymbol}
                  price={parseFloat(ticker.lastPrice)}
                  change={parseFloat(ticker.priceChange)}
                  changePercent={parseFloat(ticker.priceChangePercent)}
                  volume={parseFloat(ticker.volume)}
                  marketCap={parseFloat(ticker.quoteVolume)} // Using quote volume as proxy
                  high24h={parseFloat(ticker.highPrice)}
                  low24h={parseFloat(ticker.lowPrice)}
                />
              )}
            </div>

            {/* WebSocket Health Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {isHealthy ? <Wifi className="h-4 w-4 text-performance-positive" /> : <WifiOff className="h-4 w-4 text-performance-negative" />}
                  Connection Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Quality</p>
                    <p className={`font-semibold ${connectionQuality.status === 'excellent' ? 'text-performance-positive' : 
                      connectionQuality.status === 'good' ? 'text-warning' : 'text-performance-negative'}`}>
                      {connectionQuality.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Messages/min</p>
                    <p className="font-mono">{metrics.messageRate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uptime</p>
                    <p className="font-mono">{Math.floor(metrics.uptime / 60)}m</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Errors</p>
                    <p className="font-mono text-performance-negative">{metrics.errorCount}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={testLatency}
                    className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
                  >
                    Test Latency
                  </button>
                  <button 
                    onClick={() => forceReconnect()}
                    className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
                  >
                    Reconnect
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Book Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] group">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-semibold flex items-center">
                  Order Book
                  {connectionStatus === 'connected' && (
                    <div className="ml-2 w-2 h-2 bg-chart-positive rounded-full animate-pulse" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {isLoading && !orderbook ? (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <LoadingSpinner size="lg" className="mb-4" />
                    <p>Loading orderbook data...</p>
                  </div>
                ) : orderbook ? (
                  <div className="animate-fade-in">
                    <OrderbookChart orderbook={orderbook} connectionStatus={connectionStatus} />
                  </div>
                ) : (
                  <ErrorState
                    variant="data"
                    title="No Orderbook Data"
                    message="Unable to load orderbook information."
                  />
                )}
              </CardContent>
            </Card>
            
            <OrderbookEnhancements 
              orderbook={orderbook} 
              previousOrderbook={previousOrderbook}
            />
          </div>
          
          {/* Price Chart */}
          {klines && klines.length > 0 && (
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-semibold">Real-time Price Chart</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <CandlestickChart klines={klines} symbol={selectedSymbol} />
              </CardContent>
            </Card>
          )}

          {/* Volume & Market Depth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {klines && klines.length > 0 && (
              <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] group">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-semibold">Volume Analysis</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  {isLoading && financialData.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                      <LoadingSpinner size="lg" className="mb-4" />
                      <p>Loading volume data...</p>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <VolumeChart klines={klines} symbol={selectedSymbol} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] group">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-semibold">Market Depth</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {isLoading && !orderbook ? (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <LoadingSpinner size="lg" className="mb-4" />
                    <p>Loading depth data...</p>
                  </div>
                ) : orderbook ? (
                  <div className="animate-fade-in">
                    <DepthChart orderbook={orderbook} connectionStatus={connectionStatus} />
                  </div>
                ) : (
                  <ErrorState
                    variant="data"
                    title="No Depth Data"
                    message="Unable to load market depth information."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Error States */}
      {hasConnectionError && (
        <div className="animate-fade-in">
          <ErrorState
            variant="connection"
            title="Connection Lost"
            message="Unable to connect to real-time data feed. Using cached data where available."
            onRetry={() => window.location.reload()}
          />
        </div>
      )}

      {hasDataError && !hasConnectionError && (
        <div className="animate-fade-in">
          <ErrorState
            variant="data"
            title="Data Unavailable"
            message="Unable to load market data at this time."
            onRetry={() => window.location.reload()}
          />
        </div>
      )}
    </div>
    </TooltipProvider>
  );
};