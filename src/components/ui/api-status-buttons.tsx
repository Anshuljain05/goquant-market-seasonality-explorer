import React from 'react';
import { CheckCircle, AlertCircle, XCircle, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { APISource } from '@/services/api-manager';

interface APIHealth {
  source: APISource;
  isHealthy: boolean;
  lastChecked: number;
  responseTime?: number;
  errorCount: number;
}

interface APIStatusButtonsProps {
  currentSource: APISource;
  apiHealth: APIHealth[];
  onSourceChange: (source: APISource) => void;
  onTestConnection: (source: APISource) => Promise<void>;
  onRefreshAll: () => Promise<void>;
  className?: string;
}

export const APIStatusButtons: React.FC<APIStatusButtonsProps> = ({
  currentSource,
  apiHealth,
  onSourceChange,
  onTestConnection,
  onRefreshAll,
  className
}) => {
  const getHealthStatus = (health: APIHealth) => {
    if (!health.isHealthy || health.errorCount > 0) return 'error';
    if (!health.responseTime) return 'unknown';
    if (health.responseTime > 2000) return 'slow';
    return 'healthy';
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-3 h-3" />;
      case 'slow': return <AlertCircle className="w-3 h-3" />;
      case 'error': return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'slow': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  const getSourceLabel = (source: APISource) => {
    switch (source) {
      case 'coinbase': return 'Coinbase';
      case 'okx': return 'OKX';
      case 'kucoin': return 'KuCoin';
      default: return source;
    }
  };

  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">API Data Sources</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefreshAll}
          className="h-6 px-2"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* API Source Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {apiHealth.map((health) => {
          const status = getHealthStatus(health);
          const isActive = currentSource === health.source;
          
          return (
            <div key={health.source} className="relative">
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onSourceChange(health.source)}
                className={cn(
                  "w-full justify-start p-3 h-auto flex-col items-start",
                  isActive && "ring-2 ring-primary/20"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-xs">
                      {getSourceLabel(health.source)}
                    </span>
                    {isActive && <Zap className="w-3 h-3 text-primary" />}
                  </div>
                  <div className={getHealthColor(status)}>
                    {getHealthIcon(status)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                  <span>{formatResponseTime(health.responseTime)}</span>
                  {health.errorCount > 0 && (
                    <Badge variant="destructive" className="text-xs px-1 py-0">
                      {health.errorCount} err
                    </Badge>
                  )}
                </div>
              </Button>
              
              {/* Test Connection Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onTestConnection(health.source);
                }}
                className="absolute top-1 right-1 h-5 w-5 p-0 opacity-60 hover:opacity-100"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Current Source Status */}
      <div className="bg-muted/50 rounded-lg p-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Active Source:</span>
          <div className="flex items-center space-x-1">
            <span className="font-medium">{getSourceLabel(currentSource)}</span>
            {(() => {
              const currentHealth = apiHealth.find(h => h.source === currentSource);
              const status = currentHealth ? getHealthStatus(currentHealth) : 'unknown';
              return (
                <div className={getHealthColor(status)}>
                  {getHealthIcon(status)}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};