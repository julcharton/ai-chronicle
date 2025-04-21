import { useState } from 'react';
import type { MemoryBlock } from '@/types/memory';
import { PlayIcon } from './icons';
import { cn } from '@/lib/utils';

// Simple BlockContainer component since we don't have access to the artifacts one
interface BlockContainerProps {
  block: MemoryBlock;
  isSelected: boolean;
  onSelect: (id: string) => void;
  className?: string;
  children: React.ReactNode;
}

function BlockContainer({
  block,
  isSelected,
  onSelect,
  className,
  children,
}: BlockContainerProps) {
  return (
    <div
      className={cn(
        'relative border rounded-md transition-all',
        isSelected ? 'border-primary ring-1 ring-primary' : 'border-border',
        className,
      )}
      onClick={() => onSelect(block.id)}
    >
      {children}
    </div>
  );
}

interface VideoBlockProps {
  block: MemoryBlock;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function VideoBlock({ block, isSelected, onSelect }: VideoBlockProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const thumbnailUrl = block.metadata?.thumbnailUrl;

  const handlePlayClick = () => {
    if (block.content) {
      setIsPlaying(true);
    } else {
      // Handle the case when there's no content (could trigger file upload here)
      onSelect(block.id);
    }
  };

  return (
    <BlockContainer
      block={block}
      isSelected={isSelected}
      onSelect={onSelect}
      className="p-3 bg-background"
    >
      {block.content ? (
        <div>
          {isPlaying ? (
            <video
              controls
              className="w-full rounded-md"
              autoPlay
              onEnded={() => setIsPlaying(false)}
            >
              <source src={block.content} />
              Your browser does not support the video element.
            </video>
          ) : (
            <div
              className="relative w-full aspect-video bg-muted/30 rounded-md overflow-hidden cursor-pointer"
              onClick={handlePlayClick}
            >
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={block.metadata?.alt || 'Video thumbnail'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/5">
                  <div className="p-3 rounded-full bg-primary/10 backdrop-blur">
                    <PlayIcon size={30} />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-3 rounded-full bg-primary/10 backdrop-blur hover:bg-primary/20 transition-all">
                  <PlayIcon size={30} />
                </div>
              </div>
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {block.metadata?.duration
              ? `Duration: ${Math.floor(block.metadata.duration / 60)}:${(
                  block.metadata.duration % 60
                )
                  .toString()
                  .padStart(2, '0')}`
              : ''}
            {block.metadata?.caption && (
              <span className="ml-2">{block.metadata.caption}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full aspect-video bg-muted/30 flex items-center justify-center rounded-md">
          <div
            className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground cursor-pointer"
            onClick={handlePlayClick}
          >
            <span className="text-xl mb-2 p-2 bg-background rounded-full">
              <PlayIcon size={24} />
            </span>
            <span>{block.metadata?.alt || 'Video placeholder'}</span>
            <span className="text-xs mt-1">Click to add video</span>
          </div>
        </div>
      )}
    </BlockContainer>
  );
}
