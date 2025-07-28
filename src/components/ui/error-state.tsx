import React from 'react';
import { AlertCircle, RefreshCw, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'connection' | 'data' | 'generic';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  className,
  variant = 'generic'
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'connection':
        return {
          icon: Wifi,
          defaultTitle: 'Connection Error',
          defaultMessage: 'Unable to connect to data source. Please check your connection.',
          color: 'text-chart-accent'
        };
      case 'data':
        return {
          icon: AlertCircle,
          defaultTitle: 'Data Error',
          defaultMessage: 'Failed to load data. Please try again.',
          color: 'text-chart-negative'
        };
      default:
        return {
          icon: AlertCircle,
          defaultTitle: 'Something went wrong',
          defaultMessage: 'An unexpected error occurred.',
          color: 'text-chart-negative'
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.icon;

  return (
    <Card className={cn("text-center", className)}>
      <CardHeader>
        <div className="mx-auto mb-4">
          <Icon className={cn("w-12 h-12", config.color)} />
        </div>
        <CardTitle className="text-lg">
          {title || config.defaultTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">
          {message || config.defaultMessage}
        </p>
        
        {onRetry && (
          <Button 
            onClick={onRetry} 
            variant="outline"
            className="hover-scale transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};