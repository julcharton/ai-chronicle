import { useState, useRef, useEffect } from 'react';
import { PlayIcon } from './icons';
import { cn } from '@/lib/utils';

// Define a PauseIcon component since it doesn't exist in the icons file
const PauseIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      width={size}
      viewBox="0 0 16 16"
      style={{ color: 'currentcolor' }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5 2H5.5C5.77614 2 6 2.22386 6 2.5V13.5C6 13.7761 5.77614 14 5.5 14H3.5C3.22386 14 3 13.7761 3 13.5V2.5C3 2.22386 3.22386 2 3.5 2ZM10.5 2H12.5C12.7761 2 13 2.22386 13 2.5V13.5C13 13.7761 12.7761 14 12.5 14H10.5C10.2239 14 10 13.7761 10 13.5V2.5C10 2.22386 10.2239 2 10.5 2Z"
        fill="currentColor"
      />
    </svg>
  );
};

interface MediaPlayerProps {
  src: string;
  type: 'audio' | 'video';
  thumbnailUrl?: string;
  className?: string;
  caption?: string;
  duration?: number;
  onEnded?: () => void;
}

export function MediaPlayer({
  src,
  type,
  thumbnailUrl,
  className,
  caption,
  duration,
  onEnded,
}: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handlePlayPause = () => {
    if (!mediaRef.current) return;

    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play().catch((err) => {
        console.error('Error playing media:', err);
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!mediaRef.current || isDragging) return;
    setCurrentTime(mediaRef.current.currentTime);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTime = pos * (mediaRef.current.duration || 0);

    mediaRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (onEnded) onEnded();
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const currentRef = mediaRef.current;
    if (currentRef) {
      currentRef.addEventListener('timeupdate', handleTimeUpdate);
      currentRef.addEventListener('ended', handleEnded);

      // Handle playing state changes
      currentRef.addEventListener('play', () => setIsPlaying(true));
      currentRef.addEventListener('pause', () => setIsPlaying(false));
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('timeupdate', handleTimeUpdate);
        currentRef.removeEventListener('ended', handleEnded);
        currentRef.removeEventListener('play', () => setIsPlaying(true));
        currentRef.removeEventListener('pause', () => setIsPlaying(false));
      }
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Media element */}
      {type === 'video' ? (
        <div className="relative">
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            className={cn('w-full rounded-md', !isPlaying && 'hidden')}
            playsInline
          />

          {!isPlaying && (
            <div
              className="relative w-full aspect-video bg-muted/30 rounded-md overflow-hidden cursor-pointer"
              onClick={handlePlayPause}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={caption || 'Media thumbnail'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/10" />
              )}

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    'p-3 rounded-full transition-all',
                    isHovering ? 'bg-primary/90 scale-110' : 'bg-primary/70',
                  )}
                >
                  <PlayIcon size={24} />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-16 flex items-center bg-muted/20 rounded-md px-3">
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={src}
            className="hidden"
          />
          <button
            onClick={handlePlayPause}
            className={cn(
              'p-2 rounded-full mr-3 transition-colors',
              isPlaying
                ? 'bg-primary/20 hover:bg-primary/30'
                : 'bg-primary hover:bg-primary/90',
            )}
            type="button"
          >
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>
          <div className="flex-1">
            {caption && (
              <div className="text-sm font-medium mb-1 truncate">{caption}</div>
            )}
            <div className="text-xs text-muted-foreground">
              {formatTime(currentTime)} /{' '}
              {formatTime(mediaRef.current?.duration || duration || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Custom controls */}
      <div className="mt-2">
        {/* Progress bar */}
        <div
          ref={progressBarRef}
          className="h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer mb-2"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-primary"
            style={{
              width: `${
                mediaRef.current?.duration
                  ? (currentTime / mediaRef.current.duration) * 100
                  : 0
              }%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Play/Pause button (only for video mode) */}
          {type === 'video' && (
            <button
              onClick={handlePlayPause}
              className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
              type="button"
            >
              {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
            </button>
          )}

          {/* Time indicator */}
          <div
            className={cn(
              'text-xs text-muted-foreground',
              type === 'audio' && 'hidden',
            )}
          >
            {mediaRef.current
              ? `${formatTime(currentTime)} / ${formatTime(mediaRef.current.duration || duration || 0)}`
              : duration
                ? formatTime(duration)
                : '--:--'}
          </div>
        </div>

        {/* Caption (for video mode) */}
        {type === 'video' && caption && (
          <div className="text-sm text-muted-foreground mt-1">{caption}</div>
        )}
      </div>
    </div>
  );
}
