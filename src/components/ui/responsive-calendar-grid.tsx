import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';

interface ResponsiveCalendarGridProps {
  children: React.ReactNode;
  className?: string;
  type?: 'days' | 'weeks' | 'months';
}

export const ResponsiveCalendarGrid: React.FC<ResponsiveCalendarGridProps> = ({
  children,
  className,
  type = 'days'
}) => {
  const { isMobile, isTablet } = useBreakpoint();

  const getGridClasses = () => {
    switch (type) {
      case 'days':
        if (isMobile) {
          return 'grid-cols-7 gap-1'; // Standard 7-day week, minimal gap
        }
        if (isTablet) {
          return 'grid-cols-7 gap-2';
        }
        return 'grid-cols-7 gap-3';
      
      case 'weeks':
        if (isMobile) {
          return 'grid-cols-1 gap-2'; // Stack weeks vertically on mobile
        }
        return 'grid-cols-1 gap-4';
      
      case 'months':
        if (isMobile) {
          return 'grid-cols-1 gap-3';
        }
        if (isTablet) {
          return 'grid-cols-2 gap-4';
        }
        return 'grid-cols-3 gap-6';
      
      default:
        return 'grid-cols-7 gap-2';
    }
  };

  return (
    <div className={cn('grid w-full', getGridClasses(), className)}>
      {children}
    </div>
  );
};

interface ResponsiveCalendarContainerProps {
  children: React.ReactNode;
  className?: string;
  enableHorizontalScroll?: boolean;
}

export const ResponsiveCalendarContainer: React.FC<ResponsiveCalendarContainerProps> = ({
  children,
  className,
  enableHorizontalScroll = false
}) => {
  const { isMobile } = useBreakpoint();

  return (
    <div 
      className={cn(
        'w-full',
        isMobile && enableHorizontalScroll && 'overflow-x-auto',
        className
      )}
    >
      <div 
        className={cn(
          'w-full',
          isMobile && enableHorizontalScroll && 'min-w-[640px]' // Minimum width for horizontal scroll
        )}
      >
        {children}
      </div>
    </div>
  );
};