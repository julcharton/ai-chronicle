import { Button } from './ui/button';
import { FileIcon } from './icons';

interface MemorySuggestionProps {
  onCreateMemory: () => void;
  topic?: string;
}

export function MemorySuggestion({
  onCreateMemory,
  topic,
}: MemorySuggestionProps) {
  const suggestionText = topic
    ? `Would you like to create a memory about ${topic}?`
    : 'Would you like to create a memory?';

  return (
    <div className="flex flex-col w-full p-4 gap-3 bg-muted/30 rounded-lg border border-muted mt-2">
      <div className="flex flex-row items-start gap-3">
        <div className="mt-1 text-primary">
          <FileIcon />
        </div>
        <div>
          <div className="font-medium">Memory Creation</div>
          <div className="text-sm text-muted-foreground">{suggestionText}</div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="default"
          className="flex items-center gap-2"
          onClick={onCreateMemory}
        >
          <FileIcon size={16} />
          <span>Create Memory</span>
        </Button>
      </div>
    </div>
  );
}
