import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface TextBlockEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function TextBlockEditor({
  initialContent,
  onSave,
  onCancel,
}: TextBlockEditorProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus and select all text
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();

      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save on Ctrl+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave(content);
    }

    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[100px] p-2 border rounded-md resize-none bg-background focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="h-8 px-2 text-muted-foreground"
        >
          Cancel
        </Button>

        <Button onClick={() => onSave(content)} className="h-8 px-2">
          Save
        </Button>
      </div>
    </div>
  );
}
