import React, { useState } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { BsDownload } from 'react-icons/bs';

import styles from './Render.module.scss';
import { mainStore } from '../stores/main';
import { Slider } from '../components/Slider';

export const Render: React.FC = observer(() => {
  const [scale, setScale] = useState(1);

  if (!mainStore.loaded) {
    return (
      <div className={styles.loading}>
        <span>FFmpeg is loading... please wait!</span>
        <progress value={mainStore.loadProgress} max={1} />
      </div>
    );
  }

  const video = mainStore.video;

  if (!video) {
    return (
      <div>
        <span>No video selected.</span>
      </div>
    );
  }

  const { area } = mainStore.transform;
  const x =
    Math.trunc((video.videoWidth * scale * (area ? area[0] : 0)) / 2) * 2;
  const y =
    Math.trunc((video.videoWidth * scale * (area ? area[1] : 0)) / 2) * 2;
  const width =
    Math.trunc(
      (video.videoWidth * scale * (area ? area[2] - area[0] : 1)) / 2,
    ) * 2;
  const height =
    Math.trunc(
      (video.videoHeight * scale * (area ? area[3] - area[1] : 1)) / 2,
    ) * 2;

  const crop = async () => {
    await mainStore.ffmpeg.writeFile(
      'input',
      new Uint8Array(await mainStore.file!.arrayBuffer()),
    );

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
    args.push('-vf', filters.join(', '));

    if (time) {
      let start = 0;
      if (time[0] !== 0) {
        start = time[0] * video.duration;
        args.push('-ss', `${start}`);
      }

      if (time[1] !== 1) {
        args.push('-t', `${time[1] * video.duration - start}`);
      }
    }

    args.push('-c:v', 'libx264');
    args.push('-preset', 'veryfast');

    if (mute) {
      args.push('-an');
    } else {
      args.push('-c:a', 'copy');
    }

    mainStore.exec(args);
  };

  return (
    <div className={styles.step}>
      {mainStore.running ? (
        <div className={styles.info}>
          <span>Running</span>
          <progress value={mainStore.execProgress} max={1} />
          <pre>{mainStore.output}</pre>
        </div>
      ) : (
        <>
          <div className={styles.settings}>
            <div>
              Resolution: {width}px x {height}px
            </div>
            <div>
              Scale: {Math.round(scale * 100) / 100}
              <Slider min={0.1} max={1} value={scale} onChange={setScale} />
            </div>
          </div>
          <div className={styles.actions}>
            <button onClick={crop}>
              <span>Render MP4</span>
            </button>
            {mainStore.outputUrl && (
              <a
                href={mainStore.outputUrl}
                download="cropped.mp4"
                className={clsx('button', styles.download)}
              >
                <BsDownload />
                <span>Download</span>
              </a>
            )}
          </div>
        </>
      )}
      {mainStore.outputUrl && !mainStore.running && (
        <div>
          <video src={mainStore.outputUrl} controls />
        </div>
      )}
    </div>
  );
});
