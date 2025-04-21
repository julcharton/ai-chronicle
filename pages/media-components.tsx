import { useState } from 'react';
import Link from 'next/link';
import { VideoBlock } from '@/components/video-block';
import { MediaPlayer } from '@/components/media-player';
import type { MemoryBlock } from '@/types/memory';

export default function MediaComponents() {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [demoBlocks] = useState<MemoryBlock[]>([
    {
      id: '1',
      type: 'video',
      content:
        'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      metadata: {
        duration: 120,
        caption: 'Big Buck Bunny sample video',
        thumbnailUrl: 'https://sample-videos.com/img/Sample-jpg-image-1mb.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Media Components</h1>

      <div className="grid gap-8 mb-12">
        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Component Demo Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/video-demo"
              className="block p-4 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-medium mb-2">Video Block Demo</h3>
              <p className="text-muted-foreground">
                Demonstration of the VideoBlock component, which is designed for
                memory blocks.
              </p>
            </Link>

            <Link
              href="/media-player-demo"
              className="block p-4 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-medium mb-2">Media Player Demo</h3>
              <p className="text-muted-foreground">
                Demonstration of the unified MediaPlayer component that supports
                both audio and video.
              </p>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">VideoBlock Preview</h2>
          {demoBlocks.map((block) => (
            <VideoBlock
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              onSelect={(id) => setSelectedBlockId(id)}
            />
          ))}
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              The VideoBlock component is designed for memory block integration.
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">MediaPlayer Preview</h2>
          <MediaPlayer
            type="video"
            src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
            thumbnailUrl="https://sample-videos.com/img/Sample-jpg-image-1mb.jpg"
            caption="Big Buck Bunny sample video"
            duration={120}
          />
          <div className="mt-8">
            <MediaPlayer
              type="audio"
              src="https://sample-videos.com/audio/mp3/wave.mp3"
              caption="Audio wave sample"
              duration={26}
            />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              The MediaPlayer component provides a unified interface for both
              audio and video.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 p-6 bg-muted/20 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Implementation Notes</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            The VideoBlock component is specialized for memory blocks in the
            application.
          </li>
          <li>
            The MediaPlayer component provides a more general-purpose player
            with custom controls.
          </li>
          <li>
            Both components support thumbnails, captions, and duration
            information.
          </li>
          <li>
            The components are styled to match the application's design system.
          </li>
          <li>
            The MediaPlayer supports both audio and video through a unified
            interface.
          </li>
        </ul>
      </div>
    </div>
  );
}
