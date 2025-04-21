import { useState, useRef, useCallback } from 'react';
import { ImageIcon, LoaderIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

export type FileUploadProps = {
  onFileSelected: (file: File) => void;
  onUploadComplete?: (url: string) => void;
  accept: string;
  blockType: 'image' | 'audio';
  isUploading?: boolean;
  className?: string;
};

export function FileUpload({
  onFileSelected,
  onUploadComplete,
  accept,
  blockType,
  isUploading = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (validateFile(file, blockType)) {
          onFileSelected(file);
        }
      }
    },
    [blockType, onFileSelected],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (validateFile(file, blockType)) {
          onFileSelected(file);
        }
      }
    },
    [blockType, onFileSelected],
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md',
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {isUploading ? (
        <div className="flex flex-col items-center">
          <LoaderIcon className="w-10 h-10 animate-spin text-blue-500" />
          <span className="mt-2 text-sm text-gray-600">Uploading...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {blockType === 'image' ? (
            <ImageIcon className="w-12 h-12 text-gray-400" />
          ) : (
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
              />
            </svg>
          )}

          <p className="mt-2 text-sm text-gray-600">
            Drag & drop a {blockType === 'image' ? 'image' : 'audio'} file or{' '}
            <button
              type="button"
              onClick={handleButtonClick}
              className="text-blue-500 hover:text-blue-700 focus:outline-none"
            >
              browse
            </button>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {blockType === 'image'
              ? 'PNG, JPG, GIF up to 10MB'
              : 'MP3, WAV up to 10MB'}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to validate file type and size
function validateFile(file: File, blockType: 'image' | 'audio'): boolean {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    alert('File is too large. Maximum size is 10MB.');
    return false;
  }

  // Check file type
  if (blockType === 'image') {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return false;
    }
  } else if (blockType === 'audio') {
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file.');
      return false;
    }
  }

  return true;
}
