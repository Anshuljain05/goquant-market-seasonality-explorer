import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export interface ZoomState {
  level: number; // 0.5 to 3.0
  centerDate: Date;
}

interface ZoomControlsProps {
  zoomState: ZoomState;
  onZoomChange: (state: ZoomState) => void;
  currentDate: Date;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomState,
  onZoomChange,
  currentDate
}) => {
  const zoomIn = () => {
    const newLevel = Math.min(zoomState.level * 1.25, 3.0);
    onZoomChange({ ...zoomState, level: newLevel });
  };

  const zoomOut = () => {
    const newLevel = Math.max(zoomState.level * 0.8, 0.5);
    onZoomChange({ ...zoomState, level: newLevel });
  };

  const resetZoom = () => {
    onZoomChange({ level: 1.0, centerDate: currentDate });
  };

  const fitToView = () => {
    onZoomChange({ level: 0.8, centerDate: currentDate });
  };

  const handleSliderChange = (value: number[]) => {
    onZoomChange({ ...zoomState, level: value[0] });
  };

  const getZoomDescription = (level: number) => {
    if (level < 0.7) return 'Wide view';
    if (level < 1.2) return 'Normal';
    if (level < 2.0) return 'Detailed';
    return 'Close-up';
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Zoom Controls</h3>
          <span className="text-xs text-muted-foreground">
            {getZoomDescription(zoomState.level)}
          </span>
        </div>

        {/* Zoom Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={zoomState.level <= 0.5}
            className="flex-1"
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetZoom}
            className="flex-1"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fitToView}
            className="flex-1"
          >
            <Maximize className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={zoomState.level >= 3.0}
            className="flex-1"
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
        </div>

        {/* Zoom Slider */}
        <div className="space-y-2">
          <Label className="text-xs">
            Zoom Level: {Math.round(zoomState.level * 100)}%
          </Label>
          <Slider
            value={[zoomState.level]}
            onValueChange={handleSliderChange}
            max={3.0}
            min={0.5}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Zoom Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Center: {zoomState.centerDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}</div>
          <div>Range: ±{Math.round(30 / zoomState.level)} days</div>
        </div>
      </div>
    </Card>
  );
};