import React from 'react';

import { observer } from 'mobx-react-lite';

import { mainStore } from '../stores/main';
import { PrepareProgress } from '../components/PrepareProgress';

export const SelectFile: React.FC = observer(() => {
  return (
    <div className="flex flex-col w-full mt-20 max-w-md justify-center  mx-10 items-center ">
      {mainStore.fileLoading ? (
        <PrepareProgress />
      ) : (
        <label className="relative bg-primary text-black rounded-md p-4 mr-20 w-80 mx-10 text-center justify-center block shadow-md hover:bg-interactive-hover">
          <input
            type="file"
            accept="video/*,.mkv,.mov,.mp4,.m4v,.mk3d,.wmv,.asf,.mxf,.ts,.m2ts,.3gp,.3g2,.flv,.webm,.ogv,.rmvb,.avi"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                mainStore.loadVideo(file);
              }
              e.target.value = '';
            }}
            className="absolute inset-0 block cursor-pointer opacity-0 font-size-0"
          />
          <span className='text-secondary-foreground'>Select a video file</span>
        </label>
      )}
     
    </div>
  );
});