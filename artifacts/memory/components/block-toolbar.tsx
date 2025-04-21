import type { MemoryBlock, MemoryBlockType } from '@/types/memory';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ImageIcon,
  TrashIcon,
  ArrowUpIcon,
  CodeIcon,
  PlayIcon,
} from '@/components/icons';

interface BlockToolbarProps {
  block: MemoryBlock;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTypeChange: (type: MemoryBlockType) => void;
  isFirstBlock: boolean;
  isLastBlock: boolean;
}

export function BlockToolbar({
  block,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onTypeChange,
  isFirstBlock,
  isLastBlock,
}: BlockToolbarProps) {
  return (
    <div className="absolute -top-3 right-2 flex items-center gap-1 bg-background border rounded-md shadow-sm z-10">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onEdit}
        title="Edit content"
      >
        <PencilEditIcon className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Convert block type"
          >
            {block.type === 'text' ? (
              <CodeIcon size={16} />
            ) : block.type === 'image' ? (
              <ImageIcon size={16} />
            ) : (
              <PlayIcon size={16} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => onTypeChange('text')}
            disabled={block.type === 'text'}
          >
            <CodeIcon size={16} className="mr-2" />
            <span>Text</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTypeChange('image')}
            disabled={block.type === 'image'}
          >
            <ImageIcon size={16} className="mr-2" />
            <span>Image</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTypeChange('audio')}
            disabled={block.type === 'audio'}
          >
            <PlayIcon size={16} className="mr-2" />
            <span>Audio</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Move block"
          >
            <MoreVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onMoveUp} disabled={isFirstBlock}>
            <ArrowUpIcon size={16} className="mr-2" />
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMoveDown} disabled={isLastBlock}>
            <ArrowDownIcon className="h-4 w-4 mr-2" />
            Move down
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={onDelete}
        title="Delete block"
      >
        <TrashIcon size={16} />
      </Button>
    </div>
  );
}

// Icons used in the toolbar
function PencilEditIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
}

function MoreVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="12" cy="5" r="1"></circle>
      <circle cx="12" cy="19" r="1"></circle>
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <polyline points="19 12 12 19 5 12"></polyline>
    </svg>
  );
}
