'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  BrainIcon,
  MessageCircleIcon,
  MessageCircleQuestionIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChatModelSelector } from '@/components/chat-model-selector';
import {
  VisibilitySelector,
  type VisibilityType,
} from '@/components/visibility-selector';

export interface MemoryChatHeaderProps {
  title?: string;
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly?: boolean;
  isGuidanceMode?: boolean;
  onToggleGuidanceMode?: () => void;
}

/**
 * Header component for the Memory Chat
 * Displays title, AI model selector, visibility controls, and guidance mode toggle
 */
export function MemoryChatHeader({
  title = 'Memory Chat',
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly = false,
  isGuidanceMode = true,
  onToggleGuidanceMode,
}: MemoryChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-2 border-b shrink-0 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 flex items-center justify-center text-primary">
          <MessageCircleIcon size={18} />
        </div>
        <h2 className="font-medium text-sm md:text-base">{title}</h2>
        {isGuidanceMode && (
          <Badge variant="secondary" className="ml-2 gap-1 px-1.5 py-0">
            <BrainIcon size={12} />
            <span className="text-xs">Guidance Mode</span>
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isReadonly && onToggleGuidanceMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleGuidanceMode}
              >
                {isGuidanceMode ? (
                  <MessageCircleQuestionIcon size={16} />
                ) : (
                  <MessageCircleIcon size={16} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isGuidanceMode
                ? 'Disable AI guidance mode'
                : 'Enable AI guidance mode'}
            </TooltipContent>
          </Tooltip>
        )}

        <ChatModelSelector
          chatId={chatId}
          selectedModelId={selectedModelId}
          isReadonly={isReadonly}
        />

        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
        />
      </div>
    </div>
  );
}
