import React, { useRef } from 'react';
import { IPointerDragData, usePointerDrag } from 'react-use-pointer-drag';
import { clamp } from '../helpers';

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange?(value: number): void;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  value,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleEvent = ({ x }: IPointerDragData<unknown>) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const newValue = clamp(
      ((x - rect.left) / rect.width) * (max - min) + min,
      min,
      max,
    );
    console.log('Slider value:', newValue); // Check if dragging works
    onChange?.(newValue);
  };

  const { dragProps } = usePointerDrag({
    preventDefault: true,
    stopPropagation: true,
    onClick: handleEvent,
    onMove: handleEvent,
  });

  return (
    <div className="py-4">
      {/* Ensure relative positioning for absolute child */}
      <div className="relative bg-accent-foreground h-2 rounded-md" ref={trackRef} {...dragProps()}>
        <div
          className="absolute top-[-0.75rem] h-8 w-3 bg-primary rounded-md"
          style={{
            left: `${((value - min) / (max - min)) * 100}%`,
            transform: 'translate(-50%, 0)',
          }}
        ></div>
      </div>
    </div>
  );
};