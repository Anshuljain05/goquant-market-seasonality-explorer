import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('lg');
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });

      let newBreakpoint: Breakpoint = 'xs';
      
      if (width >= breakpoints['2xl']) {
        newBreakpoint = '2xl';
      } else if (width >= breakpoints.xl) {
        newBreakpoint = 'xl';
      } else if (width >= breakpoints.lg) {
        newBreakpoint = 'lg';
      } else if (width >= breakpoints.md) {
        newBreakpoint = 'md';
      } else if (width >= breakpoints.sm) {
        newBreakpoint = 'sm';
      } else {
        newBreakpoint = 'xs';
      }
      
      setCurrentBreakpoint(newBreakpoint);
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  const isBreakpoint = (breakpoint: Breakpoint) => {
    return currentBreakpoint === breakpoint;
  };

  const isAboveBreakpoint = (breakpoint: Breakpoint) => {
    return screenSize.width >= breakpoints[breakpoint];
  };

  const isBelowBreakpoint = (breakpoint: Breakpoint) => {
    return screenSize.width < breakpoints[breakpoint];
  };

  const isMobile = isBelowBreakpoint('md');
  const isTablet = isAboveBreakpoint('md') && isBelowBreakpoint('lg');
  const isDesktop = isAboveBreakpoint('lg');

  return {
    currentBreakpoint,
    screenSize,
    isBreakpoint,
    isAboveBreakpoint,
    isBelowBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
  };
};