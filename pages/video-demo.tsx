import { useState } from 'react';
import { VideoBlock } from '@/components/video-block';
import type { MemoryBlock } from '@/types/memory';

export default function VideoDemo() {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [demoBlocks] = useState<MemoryBlock[]>([
    {
      id: '1',
      type: 'video',
      content:
        'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      metadata: {
        duration: 120,
        caption: 'Big Buck Bunny sample video',
        thumbnailUrl: 'https://sample-videos.com/img/Sample-jpg-image-1mb.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      type: 'video',
      content:
        'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      metadata: {
        duration: 61,
        caption: 'Low resolution sample video',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      type: 'video',
      content: '',
      metadata: {
        alt: 'Upload a video here',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Video Block Demo</h1>

      <div className="grid gap-6">
        {demoBlocks.map((block) => (
          <VideoBlock
            key={block.id}
            block={block}
            isSelected={selectedBlockId === block.id}
            onSelect={(id) => setSelectedBlockId(id)}
          />
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted/30 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Usage Instructions</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Click on a video thumbnail to play the video</li>
          <li>Videos automatically display their duration when available</li>
          <li>Videos can show a custom thumbnail when provided</li>
          <li>
            Empty video blocks can be used as placeholders for new content
          </li>
        </ul>
      </div>
    </div>
  );
}
