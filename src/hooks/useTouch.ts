import { useCallback, useEffect, useRef, useState } from 'react';

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  isMultiTouch: boolean;
  scale: number;
  rotation: number;
}

interface TouchGestures {
  onTap?: (e: TouchEvent) => void;
  onDoubleTap?: (e: TouchEvent) => void;
  onPinch?: (scale: number, e: TouchEvent) => void;
  onPan?: (deltaX: number, deltaY: number, e: TouchEvent) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', e: TouchEvent) => void;
  onRotate?: (rotation: number, e: TouchEvent) => void;
}

interface TouchOptions {
  enablePinch?: boolean;
  enablePan?: boolean;
  enableSwipe?: boolean;
  enableRotation?: boolean;
  minSwipeDistance?: number;
  maxTapDuration?: number;
  doubleTapDelay?: number;
  pinchThreshold?: number;
}

const defaultOptions: TouchOptions = {
  enablePinch: true,
  enablePan: true,
  enableSwipe: true,
  enableRotation: false,
  minSwipeDistance: 50,
  maxTapDuration: 300,
  doubleTapDelay: 300,
  pinchThreshold: 0.1
};

export const useTouch = (
  gestures: TouchGestures,
  options: TouchOptions = {}
) => {
  const opts = { ...defaultOptions, ...options };
  const elementRef = useRef<HTMLElement>(null);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    distance: 0,
    isMultiTouch: false,
    scale: 1,
    rotation: 0
  });

  // Touch tracking
  const touchStartTime = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const initialDistance = useRef<number>(0);
  const initialRotation = useRef<number>(0);
  const isPanning = useRef<boolean>(false);

  // Calculate distance between two touches
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate rotation between two touches
  const getRotation = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    touchStartTime.current = Date.now();
    isPanning.current = false;
    
    const touch = e.touches[0];
    const isMultiTouch = e.touches.length > 1;
    
    let distance = 0;
    let rotation = 0;
    
    if (isMultiTouch && e.touches.length === 2) {
      distance = getDistance(e.touches[0], e.touches[1]);
      rotation = getRotation(e.touches[0], e.touches[1]);
      initialDistance.current = distance;
      initialRotation.current = rotation;
    }

    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      distance,
      isMultiTouch,
      scale: 1,
      rotation: 0
    });
  }, [getDistance, getRotation]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    const touch = e.touches[0];
    const isMultiTouch = e.touches.length > 1;
    
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    
    let distance = 0;
    let scale = 1;
    let rotation = 0;
    
    if (isMultiTouch && e.touches.length === 2) {
      distance = getDistance(e.touches[0], e.touches[1]);
      scale = distance / initialDistance.current;
      rotation = getRotation(e.touches[0], e.touches[1]) - initialRotation.current;
      
      // Handle pinch gesture
      if (opts.enablePinch && Math.abs(scale - 1) > opts.pinchThreshold!) {
        gestures.onPinch?.(scale, e);
      }
      
      // Handle rotation gesture
      if (opts.enableRotation && Math.abs(rotation) > 5) {
        gestures.onRotate?.(rotation, e);
      }
    } else if (opts.enablePan && !isMultiTouch) {
      // Handle pan gesture
      isPanning.current = true;
      gestures.onPan?.(deltaX, deltaY, e);
    }

    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      distance,
      isMultiTouch,
      scale,
      rotation
    }));
  }, [touchState.startX, touchState.startY, opts.enablePinch, opts.enablePan, opts.enableRotation, opts.pinchThreshold, gestures, getDistance, getRotation]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    const touchDuration = Date.now() - touchStartTime.current;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Handle tap gestures
    if (!isPanning.current && touchDuration < opts.maxTapDuration! && distance < 10) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;
      
      if (timeSinceLastTap < opts.doubleTapDelay!) {
        // Double tap
        gestures.onDoubleTap?.(e);
        lastTapTime.current = 0; // Reset to prevent triple tap
      } else {
        // Single tap
        gestures.onTap?.(e);
        lastTapTime.current = now;
      }
    }
    
    // Handle swipe gestures
    if (opts.enableSwipe && distance > opts.minSwipeDistance!) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (absX > absY) {
        // Horizontal swipe
        const direction = deltaX > 0 ? 'right' : 'left';
        gestures.onSwipe?.(direction, e);
      } else {
        // Vertical swipe
        const direction = deltaY > 0 ? 'down' : 'up';
        gestures.onSwipe?.(direction, e);
      }
    }
    
    // Reset state
    isPanning.current = false;
    setTouchState(prev => ({
      ...prev,
      deltaX: 0,
      deltaY: 0,
      scale: 1,
      rotation: 0,
      isMultiTouch: false
    }));
  }, [touchState.startX, touchState.startY, opts.maxTapDuration, opts.doubleTapDelay, opts.enableSwipe, opts.minSwipeDistance, gestures]);

  // Attach event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Use passive: false to allow preventDefault
    const options = { passive: false };
    
    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);
    element.addEventListener('touchcancel', handleTouchEnd, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    touchState,
    isTouch: touchState.isMultiTouch || isPanning.current
  };
};

// Chart-specific touch hook
export const useChartTouch = (
  onZoom?: (scale: number) => void,
  onPan?: (deltaX: number, deltaY: number) => void,
  onReset?: () => void
) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  const gestures: TouchGestures = {
    onPinch: useCallback((scale: number) => {
      const newZoom = Math.max(0.5, Math.min(5, zoomLevel * scale));
      setZoomLevel(newZoom);
      onZoom?.(newZoom);
    }, [zoomLevel, onZoom]),
    
    onPan: useCallback((deltaX: number, deltaY: number) => {
      const newOffset = {
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY
      };
      setPanOffset(newOffset);
      onPan?.(deltaX, deltaY);
    }, [panOffset, onPan]),
    
    onDoubleTap: useCallback(() => {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
      onReset?.();
    }, [onReset])
  };

  const touchProps = useTouch(gestures, {
    enablePinch: true,
    enablePan: true,
    enableSwipe: false,
    enableRotation: false
  });

  return {
    ...touchProps,
    zoomLevel,
    panOffset,
    resetZoom: () => {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
      onReset?.();
    }
  };
};