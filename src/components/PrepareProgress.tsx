import React from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';

import { mainStore } from '../stores/main';

export const PrepareProgress: React.FC = observer(() => {
  const { ffmpeg, fileLoading } = mainStore;

  if (!fileLoading) {
    return null;
  }

  if (!ffmpeg.loaded) {
    return (
      <div className="min-w-0 w-full max-w-md">
        <div className="mb-1 flex items-center">
          <button
            onClick={() => {
              runInAction(() => {
                ffmpeg.onLoadCallback = undefined;
                mainStore.fileLoading = false;
              });
            }}
          >
            <span>Cancel</span>
          </button>
        </div>
        <div className="mb-1">
          <span>Preparing video preview - loading FFMpeg</span>
          <progress className="w-full" value={ffmpeg.loadProgress} max={1} />
        </div>
      </div>
    );
  }

  if (ffmpeg.running) {
    return (
      <div className="min-w-0 w-full max-w-md">
        <div className="mb-1 flex items-center">
          <button
            onClick={() => {
              runInAction(() => {
                ffmpeg.cancel();
                mainStore.fileLoading = false;
              });
            }}
          >
            <span>Cancel</span>
          </button>
        </div>
        <div className="mb-1">
          <span>Preparing video preview - remuxing</span>
          <progress className="w-full" value={ffmpeg.execProgress} max={1} />
          <pre className="max-w-full max-h-500 overflow-wrap break-word whitespace-pre-wrap overflow-y-auto overflow-x-hidden">{ffmpeg.output}</pre>
        </div>
      </div>
    );
  }

  return <div className="loading">Loading...</div>;
});
