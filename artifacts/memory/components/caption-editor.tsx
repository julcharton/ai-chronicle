import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CaptionEditorProps {
  initialCaption?: string;
  onSave: (caption: string) => void;
  onCancel: () => void;
}

export function CaptionEditor({
  initialCaption = '',
  onSave,
  onCancel,
}: CaptionEditorProps) {
  const [caption, setCaption] = useState(initialCaption);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSave(caption);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      <Input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a caption..."
        className="w-full"
        autoFocus
      />

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="h-8 px-2 text-muted-foreground"
        >
          Cancel
        </Button>

        <Button onClick={() => onSave(caption)} className="h-8 px-2">
          Save
        </Button>
      </div>
    </div>
  );
}
