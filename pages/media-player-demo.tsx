import { useState } from 'react';
import { MediaPlayer } from '@/components/media-player';

export default function MediaPlayerDemo() {
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('video');

  const tabStyle = (tab: 'audio' | 'video') =>
    `px-4 py-2 font-medium ${
      activeTab === tab
        ? 'bg-primary text-primary-foreground rounded-md'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Media Player Component Demo</h1>

      <div className="flex space-x-4 mb-6">
        <button
          className={tabStyle('video')}
          onClick={() => setActiveTab('video')}
          type="button"
        >
          Video Examples
        </button>
        <button
          className={tabStyle('audio')}
          onClick={() => setActiveTab('audio')}
          type="button"
        >
          Audio Examples
        </button>
      </div>

      <div className="grid gap-8">
        {activeTab === 'video' ? (
          <>
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">
                Video with Thumbnail
              </h2>
              <MediaPlayer
                type="video"
                src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
                thumbnailUrl="https://sample-videos.com/img/Sample-jpg-image-1mb.jpg"
                caption="Big Buck Bunny sample video"
                duration={120}
              />
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">
                Video without Thumbnail
              </h2>
              <MediaPlayer
                type="video"
                src="https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4"
                caption="Low resolution sample video"
                duration={61}
              />
            </div>
          </>
        ) : (
          <>
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Audio Sample 1</h2>
              <MediaPlayer
                type="audio"
                src="https://sample-videos.com/audio/mp3/wave.mp3"
                caption="Audio wave sample"
                duration={26}
              />
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Audio Sample 2</h2>
              <MediaPlayer
                type="audio"
                src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                caption="SoundHelix Song 1"
                duration={230}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-8 p-4 bg-muted/30 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Component Features</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Unified interface for both audio and video</li>
          <li>Custom controls with play/pause functionality</li>
          <li>Progress bar with seeking capability</li>
          <li>Time display showing current position and duration</li>
          <li>Support for thumbnails (video) and captions</li>
          <li>Clean, responsive design that matches your application style</li>
        </ul>
      </div>
    </div>
  );
}
