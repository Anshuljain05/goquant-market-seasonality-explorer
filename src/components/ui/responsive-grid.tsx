import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  minHeight?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { default: 1, md: 2, lg: 3 },
  gap = 4,
  minHeight = '300px'
}) => {
  const isMobile = useIsMobile();
  
  const gridClasses = cn(
    'grid w-full',
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  );

  return (
    <div 
      className={gridClasses}
      style={{ minHeight: isMobile ? 'auto' : minHeight }}
    >
      {children}
    </div>
  );
};

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  title?: string;
  onToggle?: (collapsed: boolean) => void;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  collapsible = false,
  defaultCollapsed = false,
  title,
  onToggle
}) => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed && isMobile);

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onToggle?.(newState);
  };

  return (
    <div className={cn(
      'bg-card border rounded-lg overflow-hidden',
      'transition-all duration-200 ease-in-out',
      className
    )}>
      {collapsible && title && (
        <div 
          className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-muted/50"
          onClick={handleToggle}
        >
          <h3 className="font-semibold text-foreground">{title}</h3>
          <div className={cn(
            'transition-transform duration-200',
            isCollapsed ? 'rotate-180' : 'rotate-0'
          )}>
            ▼
          </div>
        </div>
      )}
      
      <div className={cn(
        'transition-all duration-200 ease-in-out overflow-hidden',
        isCollapsed ? 'max-h-0 p-0' : 'max-h-none p-4'
      )}>
        {children}
      </div>
    </div>
  );
};

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
  showScrollbar?: boolean;
}

export const HorizontalScroll: React.FC<HorizontalScrollProps> = ({
  children,
  className,
  showScrollbar = false
}) => {
  return (
    <div className={cn(
      'overflow-x-auto',
      !showScrollbar && 'scrollbar-hide',
      'touch-pan-x',
      className
    )}>
      <div className="flex space-x-4 min-w-max pb-2">
        {children}
      </div>
    </div>
  );
};

interface MobileStackProps {
  children: ReactNode;
  className?: string;
  spacing?: number;
}

export const MobileStack: React.FC<MobileStackProps> = ({
  children,
  className,
  spacing = 4
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className={cn(
      'flex flex-col',
      `space-y-${spacing}`,
      className
    )}>
      {children}
    </div>
  );
};

interface TouchFriendlyButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const TouchFriendlyButton: React.FC<TouchFriendlyButtonProps> = ({
  children,
  onClick,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const isMobile = useIsMobile();
  
  const baseClasses = cn(
    'inline-flex items-center justify-center rounded-md font-medium',
    'transition-colors focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    // Ensure minimum touch target size on mobile
    isMobile && 'min-h-[44px] min-w-[44px]'
  );

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
  };

  const sizeClasses = {
    sm: isMobile ? 'h-10 px-4 py-2' : 'h-8 px-3 py-1',
    md: isMobile ? 'h-12 px-6 py-3' : 'h-10 px-4 py-2',
    lg: isMobile ? 'h-14 px-8 py-4' : 'h-12 px-6 py-3'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
  stickyHeader?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className,
  stickyHeader = true
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      'relative w-full overflow-auto',
      isMobile && 'max-h-[50vh]',
      className
    )}>
      <table className={cn(
        'w-full caption-bottom text-sm',
        stickyHeader && 'relative'
      )}>
        {children}
      </table>
    </div>
  );
};

// Utility component for mobile-first responsive design
interface BreakpointProviderProps {
  children: ReactNode;
  mobile?: ReactNode;
  desktop?: ReactNode;
}

export const BreakpointProvider: React.FC<BreakpointProviderProps> = ({
  children,
  mobile,
  desktop
}) => {
  const isMobile = useIsMobile();

  if (mobile && isMobile) {
    return <>{mobile}</>;
  }

  if (desktop && !isMobile) {
    return <>{desktop}</>;
  }

  return <>{children}</>;
};

// CSS for hiding scrollbars
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('scrollbar-hide-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'scrollbar-hide-styles';
  styleElement.textContent = scrollbarHideStyles;
  document.head.appendChild(styleElement);
}