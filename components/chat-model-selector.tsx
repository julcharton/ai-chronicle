'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { chatModels, DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { cn } from '@/lib/utils';
import { SparklesIcon, ChevronDownIcon } from './icons';

interface ChatModelSelectorProps {
  chatId: string;
  selectedModelId: string;
  isReadonly?: boolean;
}

export function ChatModelSelector({
  chatId,
  selectedModelId,
  isReadonly = false,
}: ChatModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [localSelectedModelId, setLocalSelectedModelId] = useState(
    selectedModelId || DEFAULT_CHAT_MODEL,
  );

  // Handle model change by updating the local state and potentially making an API call
  const handleModelChange = async (modelId: string) => {
    setLocalSelectedModelId(modelId);
    setOpen(false);

    // In a real implementation, you might want to update the model selection on the server
    // await fetch(`/api/chat/${chatId}/model`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ modelId }),
    // });
  };

  // Get the selected model details
  const selectedModel = chatModels.find(
    (model) => model.id === localSelectedModelId,
  );

  if (isReadonly) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="hidden md:flex md:px-2 md:h-[34px]"
        >
          <span className="mr-1">
            <SparklesIcon />
          </span>
          {selectedModel?.name || 'Select Model'}
          <span className="ml-1">
            <ChevronDownIcon />
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        {chatModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onSelect={() => handleModelChange(model.id)}
            className={cn(
              'cursor-pointer',
              model.id === localSelectedModelId ? 'font-medium' : '',
            )}
          >
            {model.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
