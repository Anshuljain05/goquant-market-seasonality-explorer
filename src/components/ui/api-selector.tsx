import React from 'react';
import { Check, Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APISource } from '@/services/api-manager';

interface APIHealth {
  source: APISource;
  isHealthy: boolean;
  lastChecked: number;
  responseTime?: number;
  errorCount: number;
}

interface APISelectorProps {
  currentSource: APISource;
  apiHealth: APIHealth[];
  onSourceChange: (source: APISource) => void;
  className?: string;
}

export const APISelector: React.FC<APISelectorProps> = ({
  currentSource,
  apiHealth,
  onSourceChange,
  className
}) => {
  const getHealthStatus = (health: APIHealth) => {
    if (health.errorCount > 3) return 'error';
    if (!health.isHealthy) return 'warning';
    if (health.responseTime && health.responseTime > 1000) return 'slow';
    return 'healthy';
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Wifi className="w-3 h-3 text-performance-positive" />;
      case 'slow': return <Clock className="w-3 h-3 text-warning" />;
      case 'warning': return <AlertTriangle className="w-3 h-3 text-warning" />;
      case 'error': return <WifiOff className="w-3 h-3 text-performance-negative" />;
      default: return <WifiOff className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-performance-positive';
      case 'slow': return 'bg-warning';
      case 'warning': return 'bg-warning';
      case 'error': return 'bg-performance-negative';
      default: return 'bg-muted';
    }
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  const currentHealth = apiHealth.find(h => h.source === currentSource);
  const currentStatus = currentHealth ? getHealthStatus(currentHealth) : 'error';

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current API Status */}
      <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <span>Active Data Source</span>
            <Badge variant="outline" className={`${getHealthColor(currentStatus)} text-white border-none`}>
              {currentSource.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getHealthIcon(currentStatus)}
              <span className="text-sm font-medium">
                {currentStatus === 'healthy' ? 'Connected' : 
                 currentStatus === 'slow' ? 'Slow Response' :
                 currentStatus === 'warning' ? 'Connection Issues' : 'Disconnected'}
              </span>
            </div>
            {currentHealth?.responseTime && (
              <Badge variant="secondary" className="text-xs">
                {formatResponseTime(currentHealth.responseTime)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Selector */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Switch Data Source</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Select value={currentSource} onValueChange={(value: APISource) => onSourceChange(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {apiHealth.map((health) => {
                const status = getHealthStatus(health);
                return (
                  <SelectItem key={health.source} value={health.source}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {getHealthIcon(status)}
                        <span className="capitalize font-medium">{health.source}</span>
                        {health.source === currentSource && (
                          <Check className="w-3 h-3 text-primary" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        {formatResponseTime(health.responseTime)}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* API Health Dashboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">API Health Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {apiHealth.map((health) => {
              const status = getHealthStatus(health);
              const lastChecked = health.lastChecked ? 
                Math.floor((Date.now() - health.lastChecked) / 1000) : null;
              
              return (
                <div key={health.source} className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-muted/20 to-transparent">
                  <div className="flex items-center gap-3">
                    {getHealthIcon(status)}
                    <div>
                      <p className="font-medium text-sm capitalize">{health.source}</p>
                      <p className="text-xs text-muted-foreground">
                        {lastChecked !== null ? `Checked ${lastChecked}s ago` : 'Not checked'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge 
                      variant="secondary" 
                      className={`${getHealthColor(status)} text-white text-xs border-none`}
                    >
                      {status}
                    </Badge>
                    {health.responseTime && (
                      <p className="text-xs text-muted-foreground">
                        {formatResponseTime(health.responseTime)}
                      </p>
                    )}
                    {health.errorCount > 0 && (
                      <p className="text-xs text-performance-negative">
                        {health.errorCount} errors
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};