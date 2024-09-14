import React, { useEffect, useRef, useState } from 'react';
import { BsPlay, BsPause } from 'react-icons/bs';
import { usePointerDrag } from 'react-use-pointer-drag';
import clsx from 'clsx';
import { Time } from '../types';
import { clamp } from '../helpers';
import { humanTime } from '../helpers';
interface VideoTrimProps {
  onChange: (time: Time) => void;
  time?: Time;
  video: HTMLVideoElement;
}

const MIN_DURATION = 1;

export const VideoTrim: React.FC<VideoTrimProps> = ({
  onChange,
  video,
  time = [0, video.duration],
}) => {
  const [currentTime, setCurrentTime] = useState(video.currentTime);
  const [playing, setPlaying] = useState(!video.paused);
  const ignoreTimeUpdatesRef = useRef(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const { dragProps, dragState } = usePointerDrag<{
    direction: string;
    time?: Time;
    currentTime?: number;
    paused: boolean;
  }>({
    stopPropagation: true,
    pointerDownStopPropagation: true,
    onStart: () => {
      video.pause();
    },
    onClick: ({ state, x }) => {
      if (state.direction !== 'move') {
        return;
      }

      const rect = timelineRef.current!.getBoundingClientRect();
      const relativeX =
        clamp((x - rect.left) / rect.width, 0, 1) * video.duration;
      const currentTime = clamp(relativeX, state.time![0], state.time![1]);
      setCurrentTime(currentTime);
      video.currentTime = currentTime;
    },
    onMove: ({ x, deltaX, state }) => {
      ignoreTimeUpdatesRef.current = true;
      const rect = timelineRef.current!.getBoundingClientRect();

      let relativeX =
        clamp((x - rect.left) / rect.width, 0, 1) * video.duration;
      const newTime: Time = [...time];

      switch (state.direction) {
        case 'move':
          {
            relativeX = clamp(
              (deltaX / rect.width) * video.duration,
              -1 * state.time![0],
              video.duration - state.time![1],
            );
            newTime[0] = state.time![0] + relativeX;
            newTime[1] = state.time![1] + relativeX;

            const currentTime = clamp(
              video.currentTime,
              newTime[0],
              newTime[1],
            );
            setCurrentTime(currentTime);
            video.currentTime = currentTime;
          }
          break;
        case 'left':
          newTime[0] = Math.min(
            relativeX,
            Math.max(newTime[1] - MIN_DURATION, 0),
          );
          video.currentTime = newTime[0] + 0.01;
          break;
        case 'right':
          newTime[1] = Math.max(
            relativeX,
            Math.min(newTime[0] + MIN_DURATION, video.duration),
          );
          video.currentTime = newTime[1];
          break;
        case 'seek':
          {
            const currentTime = clamp(
              relativeX,
              state.time![0],
              state.time![1],
            );
            setCurrentTime(currentTime);
            video.currentTime = currentTime;
          }
          break;
      }

      onChange(newTime);
    },
    onEnd: ({ state }) => {
      ignoreTimeUpdatesRef.current = false;
      if (typeof state.currentTime !== 'undefined') {
        video.currentTime = state.currentTime;
      }

      if (!state.paused) {
        video.play();
      }
    },
  });


  useEffect(() => {
    const update = () => {
      setPlaying(!video.paused);

      if (!ignoreTimeUpdatesRef.current) {
        setCurrentTime(video.currentTime);
      }
    };

    video.addEventListener('pause', update);
    video.addEventListener('playing', update);
    video.addEventListener('play', update);
    video.addEventListener('timeupdate', update);

    return () => {
      video.removeEventListener('pause', update);
      video.removeEventListener('playing', update);
      video.removeEventListener('play', update);
      video.removeEventListener('timeupdate', update);
    };
  }, [video, setPlaying]);

  return (
    <div className="flex flex-col mb-4  mx-10 my-3 mt-4">
    <div className="flex mb-5  ml-0 ">
      <button
        onClick={() => {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }}
        className="bg-primary text-secondary-foreground px-3 py-2 rounded-md"
      >
        {playing ? <BsPause /> : <BsPlay />}
      </button>
      <div className="text-accent ml-3 mt-1">
        Current Time: {humanTime(currentTime)}
      </div>
    </div>
  
    <div className="relative w-full h-12 bg-accent-foreground shadow-md mt-2" ref={timelineRef}>
      {/* Left Time Indicator */}
      <div className="absolute -top-6 left-0 text-accent">
        {humanTime(time[0])}
      </div>
  
      {/* Trim Range */}
      <div
        className={clsx(
          'absolute top-0 bottom-0 bg-gray-500 cursor-move',
          { 'active': dragState?.direction === 'move' }
        )}
        style={{
          left: `${(time[0] / video.duration) * 100}%`,
          right: `${100 - (time[1] / video.duration) * 100}%`,
        }}
        {...dragProps({
          direction: 'move',
          time,
          paused: video.paused,
        })}
      >
        {/* Left Resize Handle */}
        <div
          className={clsx(
            'absolute top-0 bottom-0 w-4 bg-blue-600 border-2 border-white cursor-w-resize',
            { 'active': dragState?.direction === 'left' }
          )}
          style={{ left: 0 }}
          data-time={humanTime(time[0])}
          {...dragProps({
            direction: 'left',
            currentTime,
            paused: video.paused,
          })}
        />
  
        {/* Right Resize Handle */}
        <div
          className={clsx(
            'absolute top-0 bottom-0 w-4 bg-blue-600 border-2 border-white cursor-e-resize',
            { 'active': dragState?.direction === 'right' }
          )}
          style={{ right: 0 }}
          data-time={humanTime(time[1])}
          {...dragProps({
            direction: 'right',
            currentTime,
            paused: video.paused,
          })}
        />
      </div>
  
      {/* Current Time Indicator */}
      <div
        className={clsx(
          'absolute top-0 bottom-0 w-2 bg-primary border-l-2 border-none cursor-ew-resize',
          { 'active': dragState?.direction === 'seek' }
        )}
        style={{
          left: `${(currentTime / video.duration) * 100}%`,
        }}
        {...dragProps({
          direction: 'seek',
          time,
          paused: video.paused,
        })}
        data-time={humanTime(currentTime)}
      ></div>
  
      {/* Right Time Indicator */}
      <div className="absolute -top-6 right-0 text-accent">
        {humanTime(time[1])}
      </div>
    </div>
  </div>
  
  );
};