import React, { useState } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { BsDownload } from 'react-icons/bs';
import { runInAction } from 'mobx';

import { mainStore } from '../stores/main';
import { Slider } from '../components/Slider';

export const Render: React.FC = observer(() => {
  const [outputUrl, setOutputUrl] = useState<string>();
  const [logVisible, setLogVisible] = useState(false);

  const { ffmpeg, video } = mainStore;

  if (!ffmpeg.loaded) {
    return (
      <div className="flex flex-col w-full max-w-md">
        <span>FFmpeg is loading... please wait!</span>
        <progress value={ffmpeg.loadProgress} max={1} className="w-full" />
      </div>
    );
  }

  if (!video) {
    return (
      <div>
        <span>No video selected.</span>
      </div>
    );
  }

  const { area, scale = 1 } = mainStore.transform;
  const x = Math.trunc((scale * (area ? area[0] : 0)) / 2) * 2;
  const y = Math.trunc((scale * (area ? area[1] : 0)) / 2) * 2;
  const width =
    Math.trunc((scale * (area ? area[2] : video.videoWidth)) / 2) * 2;
  const height =
    Math.trunc((scale * (area ? area[3] : video.videoHeight)) / 2) * 2;

  const crop = async () => {
    setOutputUrl(undefined);

    const args: string[] = [];
    const filters: string[] = [];

    const { flipH, flipV, area, time, mute } = mainStore.transform;

    if (flipH) {
      filters.push('hflip');
    }

    if (flipV) {
      filters.push('vflip');
    }

    if (scale !== 1) {
      filters.push(
        `scale=${Math.trunc((video.videoWidth * scale) / 2) * 2}:${
          Math.trunc((video.videoHeight * scale) / 2) * 2
        }`,
      );
    }

    if (
      area &&
      (area[0] !== 0 || area[1] !== 0 || area[2] !== 1 || area[3] !== 1)
    ) {
      filters.push(`crop=${width}:${height}:${x}:${y}`);
    }

    // Add filters
    if (filters.length > 0) {
      args.push('-vf', filters.join(', '));
    }

    if (time) {
      let start = 0;
      if (time[0] > 0) {
        start = time[0];
        args.push('-ss', `${start}`);
      }

      if (time[1] < video.duration) {
        args.push('-t', `${time[1] - start}`);
      }
    }

    args.push('-c:v', 'libx264');
    args.push('-preset', 'veryfast');

    if (mute) {
      args.push('-an');
    } else {
      args.push('-c:a', 'copy');
    }

    const newFile = await ffmpeg.exec(mainStore.file!, args);
    setOutputUrl(URL.createObjectURL(newFile));
  };

  return (
    <div className="flex flex-col w-full max-w-md text-primary-foreground justify-center items-center">
      {ffmpeg.running ? (
        <div className='flex flex-col'>
          <div className="mb-4">
            <button onClick={() => ffmpeg.cancel()}>
              <span>Cancel</span>
            </button>
          </div>
          <div className="mb-4">
            <span>Running</span>
            <progress value={ffmpeg.execProgress} max={1} className="w-full" />
            <pre className="max-w-full max-h-screen overflow-wrap break-word whitespace-pre-wrap overflow-y-auto overflow-x-hidden">
              {ffmpeg.output}
            </pre>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col mt-20 space-x-6">
            <div>
              Resolution: {width}px x {height}px
            </div>
            <div>
              Scale: {Math.round(scale * 100) / 100}
              <Slider
                min={0.1}
                max={1}
                value={scale}
                onChange={value => {
                  runInAction(() => {
                    mainStore.transform.scale = value;
                  });
                }}
              />
            </div>
          </div>
          <div className="flex justify-between mb-4 rounded-sm">
            <button onClick={crop} className='bg-primary  rounded-md h-6 w-28'>
              <span className='text-secondary-foreground'>Render MP4</span>
            </button>
            {outputUrl && (
              <a
                href={outputUrl}
                download="cropped.mp4"
                className={clsx('button', 'flex items-center')}
              >
                <BsDownload />
                <span>Download</span>
              </a>
            )}
          </div>
        </>
      )}
      {outputUrl && !ffmpeg.running && (
        <div>
          <video src={outputUrl} controls className="max-w-full" />
        </div>
      )}
      {!!ffmpeg.log && (
        <div className="mb-4">
          <button onClick={() => setLogVisible(value => !value)}>
            {logVisible ? 'Hide log' : 'Show log'}
          </button>
          {logVisible && (
            <pre className="max-w-full max-h-screen overflow-wrap break-word whitespace-pre-wrap overflow-y-auto overflow-x-hidden">
              {ffmpeg.log}
            </pre>
          )}
        </div>
      )}
    </div>
  );
});