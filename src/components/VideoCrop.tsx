import React, { useEffect, useRef, useState } from 'react';
import { usePointerDrag } from 'react-use-pointer-drag';

import { clamp } from '../helpers';
import { Area, Ratio, VideoTransform } from '../types';

const MIN_CROP_SIZE = 100;

interface VideoCropProps {
  onChange: (area: Area) => void;
  transform: VideoTransform;
  video: HTMLVideoElement;
}

function ensureRatio(ratio: Ratio, area: Area): Area {
  const newArea: Area = [...area];

  if (ratio > 1) {
    newArea[3] = newArea[2] / ratio;
  } else {
    newArea[2] = newArea[3] * ratio;
  }

  return newArea;
}

const handleDirections = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export const VideoCrop: React.FC<VideoCropProps> = ({
  transform,
  onChange,
  video,
}) => {
  const { area = [0, 0, video.videoWidth, video.videoHeight] } = transform;
  const [ratioName, setRatioName] = useState('free');
  const [ratio, setRatio] = useState<Ratio>();
  const canvasPreviewRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef(transform);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    const canvas = canvasPreviewRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }
  }, [video]);
 
  const { dragProps } = usePointerDrag<{
    dirX: number;
    dirY: number;
    area: Area;
  }>({
    preventDefault: true,
    stopPropagation: true,
    onMove: ({ x, y, deltaX, deltaY, state: { dirX, dirY, area } }) => {
      const rect = canvasPreviewRef.current!.getBoundingClientRect();
      const newArea: Area = [...area];

      if (dirX === 0 && dirY === 0) {
        newArea[0] = clamp(
          area[0] + deltaX / (rect.width / video.videoWidth),
          0,
          video.videoWidth - area[2]
        );
        newArea[1] = clamp(
          area[1] + deltaY / (rect.height / video.videoHeight),
          0,
          video.videoHeight - area[3]
        );
      } else {
        const relativeX = clamp(
          (x - rect.left) / (rect.width / video.videoWidth),
          0,
          video.videoWidth
        );
        const relativeY = clamp(
          (y - rect.top) / (rect.height / video.videoHeight),
          0,
          video.videoHeight
        );

        const endX = area[0] + area[2];
        const endY = area[1] + area[3];

        if (dirX !== 0 || dirY !== 0) {
          if (dirY === -1) {
            newArea[1] = Math.min(relativeY, Math.max(endY - MIN_CROP_SIZE, 0));
            newArea[3] = endY - newArea[1];
          } else if (dirY === 1) {
            newArea[3] = Math.max(relativeY - newArea[1], MIN_CROP_SIZE);
          }

          if (dirX === -1) {
            newArea[0] = Math.min(relativeX, Math.max(endX - MIN_CROP_SIZE, 0));
            newArea[2] = endX - newArea[0];
          } else if (dirX === 1) {
            newArea[2] = Math.max(relativeX - newArea[0], MIN_CROP_SIZE);
          }
        }
      }
      onChange(newArea);
    }
  });

  // Tailwind-style applied on the canvas container
  useEffect(() => {
    let updating = true;
    const canvas = canvasPreviewRef.current;
    const context = canvas?.getContext('2d');
    const CANVAS_FRAME_TIME = 1000 / 30;
    let time = Date.now();

    const update = () => {
      if (!updating) return;
      const now = Date.now();
      const shouldDraw = now - time > CANVAS_FRAME_TIME && video.readyState === 4;
  
      if (canvas && context && shouldDraw) {
        time = now;
  
        // Save the current context state before applying any transformations
        context.save();
  
        // Clear the canvas before drawing
        context.clearRect(0, 0, canvas.width, canvas.height);
  
        const transform = transformRef.current;
  
        if (transform.flipH) {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        if (transform.flipV) {
          context.translate(0, canvas.height);
          context.scale(1, -1);
        }
  
        const area = transform.area!;
        if (!area) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else {
          context.filter = 'brightness(0.25)';
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
          const x = (transform.flipH ? video.videoWidth - area[2] - area[0] : area[0]) *
            (video.videoWidth / canvas.width);
          const y = (transform.flipV ? video.videoHeight - area[3] - area[1] : area[1]) *
            (video.videoHeight / canvas.height);
          const w = area[2] * (video.videoWidth / canvas.width);
          const h = area[3] * (video.videoHeight / canvas.height);
  
          context.filter = 'none';
          context.drawImage(video, x, y, w, h, x, y, w, h);
        }
  
        // Restore the saved state of the canvas (before transformations)
        context.restore();
      }
  
      requestAnimationFrame(update);
    };
  
    requestAnimationFrame(update);
  
    return () => {
      updating = false;
    };
  }, [video]);
  const cropWidth = Math.trunc(area[2] / 2) * 2;
  const cropHeight = Math.trunc(area[3] / 2) * 2;

  return (
    <div className='flex flex-col mx-10'>
    <div className="mb-4">
      <div className="select">
        <select
          value={ratioName}
          onChange={(e) => {
            const selectedRatioName = e.target.value;
            setRatioName(selectedRatioName);

            switch (selectedRatioName) {
              case "1:1":
                setRatio(1);
                break;
              case "16:9":
                setRatio(16 / 9);
                break;
              case "4:3":
                setRatio(4 / 3);
                break;
              case "free":
              default:
                setRatio(undefined); // Free mode, no ratio
            }
          }} className='bg-primary text-secondary-foreground mt-3 border-primary'
        >
          <option value="free">Free</option>
          <option value="1:1">1:1</option>
          <option value="16:9">16:9</option>
          <option value="4:3">4:3</option>
        </select>
      </div>
    </div>
    <div className="relative">
      <canvas
        width={video.videoWidth}
        height={video.videoHeight}
        className="shadow-md overflow-hidden w-full"
        ref={canvasPreviewRef}
      />
      <div
        className="absolute inset-0 border-2 border-white touch-none"
        style={{
          left: `${(area[0] / video.videoWidth) * 100}%`,
          top: `${(area[1] / video.videoHeight) * 100}%`,
          width: `${(area[2] / video.videoWidth) * 100}%`,
          height: `${(area[3] / video.videoHeight) * 100}%`,
        }}
      >
        <div className="absolute top-[-2rem] right-0 z-10 text-primary-foreground bg-primary px-2 py-1">
          {cropWidth}px x {cropHeight}px
        </div>

        {/* SVG Grid Overlay */}
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Vertical Lines */}
          <line
            x1="33.33%"
            y1="0"
            x2="33.33%"
            y2="100%"
            stroke="white"
            strokeWidth="0.5"
          />
          <line
            x1="66.66%"
            y1="0"
            x2="66.66%"
            y2="100%"
            stroke="white"
            strokeWidth="0.5"
          />
          {/* Horizontal Lines */}
          <line
            x1="0"
            y1="33.33%"
            x2="100%"
            y2="33.33%"
            stroke="white"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="66.66%"
            x2="100%"
            y2="66.66%"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>

        {/* Drag Handles */}
        <div className="absolute inset-0 flex justify-center">
          {handleDirections.map((direction) => (
            <div
              key={direction}
              className={`absolute ${direction === 'n' || direction === 's' ? 'left-1/2 -translate-x-1/2' : direction === 'e' || direction === 'w' ? 'top-1/2 -translate-y-1/2' : ''} w-6 h-6 border-2 border-secondary-foreground cursor-${direction}-resize`}
              style={{
                [direction === 'n' || direction === 's' ? 'left' : direction === 'e' || direction === 'w' ? 'top' : '']: '-3px',
              }}
              {...dragProps({
                dirX: direction.includes('e') ? 1 : direction.includes('w') ? -1 : 0,
                dirY: direction.includes('s') ? 1 : direction.includes('n') ? -1 : 0,
                area,
              })}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);
};;