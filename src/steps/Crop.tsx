import React from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import {
  BsCheck,
  BsVolumeMute,
  BsSymmetryVertical,
  BsSymmetryHorizontal,
  BsVolumeUp,
  BsArrowCounterclockwise,
} from 'react-icons/bs';

import { mainStore } from '../stores/main';
import { VideoCrop } from '../components/VideoCrop';
import { VideoTrim } from '../components/VideoTrim';

export const Crop: React.FC = observer(() => {
  const video = mainStore.video;

  if (!video) {
    return (
      <div>
        <span>No video selected.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col mt-28 ml-0 mx-10 my-4">
      {/* Top Action Bar */}
      <div className="flex justify-between mmt-10">
        {/* Left Actions */}
        <div className="flex  flex-row mx-10 space-x-4  space-y">
          {/* Mute/Unmute Button */}
          <button
            title={mainStore.transform.mute ? 'Unmute' : 'Mute'}
            className="p-2 rounded bg-primary"
            onClick={() => {
              runInAction(() => {
                const mute = !mainStore.transform.mute;
                mainStore.transform = {
                  ...mainStore.transform,
                  mute,
                };
                video.muted = mute;
              });
            }}
          >
            {mainStore.transform.mute ? <BsVolumeMute /> : <BsVolumeUp />}
          </button>

          <button
            title="Flip horizontally"
            className="p-2 rounded bg-primary"
            onClick={() => {
              runInAction(() => {
                const { flipH, area } = mainStore.transform;
                mainStore.transform = {
                  ...mainStore.transform,
                  flipH: !flipH,
                  area: area
                    ? [
                        video.videoWidth - area[2] - area[0],
                        area[1],
                        area[2],
                        area[3],
                      ]
                    : undefined,
                };
              });
            }}
          >
            <BsSymmetryVertical />
          </button>

          {/* Flip Vertically Button */}
          <button
            title="Flip vertically"
            className="p-2 rounded bg-primary"
            onClick={() => {
              runInAction(() => {
                const { flipV, area } = mainStore.transform;
                mainStore.transform = {
                  ...mainStore.transform,
                  flipV: !flipV,
                  area: area
                    ? [
                        area[0],
                        video.videoHeight - area[3] - area[1],
                        area[2],
                        area[3],
                      ]
                    : undefined,
                };
              });
            }}
          >
            <BsSymmetryHorizontal />
          </button>
        </div>

       
        <div className="flex space-x-4 mx-10">
         
          <button
            title="Reset"
            className="p-2 rounded bg-primary"
            onClick={() => {
              mainStore.reset();
            }}
          >
            <BsArrowCounterclockwise />
          </button>

          
          <button
            title="Confirm"
            className="p-2 rounded bg-primary"
            onClick={() => {
              runInAction(() => {
                video.pause();
                mainStore.step = 2;
              });
            }}
          >
            <BsCheck />
          </button>
        </div>
      </div>
        {/* Video Crop Component */}
      <VideoCrop
        transform={mainStore.transform}
        video={video}
        onChange={(area) => {
          runInAction(() => {
            mainStore.transform = {
              ...mainStore.transform,
              area,
            };
          });
        }}
      />
      {/* Video Trim Component */}
      <VideoTrim
        time={mainStore.transform.time}
        video={video}
        onChange={(time) => {
          runInAction(() => {
            mainStore.transform = {
              ...mainStore.transform,
              time,
            };
          });
        }}
      />

    
     
    </div>
  );
});