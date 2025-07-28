import React from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  apiSource?: string;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status, 
  apiSource,
  className 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-chart-positive',
          bg: 'bg-chart-positive/10',
          label: 'Connected',
          variant: 'default' as const
        };
      case 'connecting':
        return {
          icon: Wifi,
          color: 'text-chart-accent animate-pulse',
          bg: 'bg-chart-accent/10',
          label: 'Connecting',
          variant: 'secondary' as const
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-chart-negative',
          bg: 'bg-chart-negative/10',
          label: 'Error',
          variant: 'destructive' as const
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-muted-foreground',
          bg: 'bg-muted/10',
          label: 'Disconnected',
          variant: 'secondary' as const
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={config.variant}
            className={cn(
              "flex items-center space-x-1 transition-all duration-300",
              config.bg,
              className
            )}
          >
            <Icon className={cn("w-3 h-3", config.color)} />
            <span className="text-xs">{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{config.label}</p>
            {apiSource && (
              <p className="text-xs text-muted-foreground">Source: {apiSource}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};