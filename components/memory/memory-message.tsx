'use client';

import type { UIMessage } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { SparklesIcon, PencilEditIcon } from '../icons';
import { BrainIcon } from 'lucide-react';
import { Markdown } from '../markdown';
import { MessageActions } from '../message-actions';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { MessageEditor } from '../message-editor';
import { Badge } from '../ui/badge';
import { UseChatHelpers } from '@ai-sdk/react';
import { AIMessageIndicator, AIIndicatorType } from './ai-message-indicator';

interface MemoryMessageProps {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isGuidanceMode?: boolean;
}

/**
 * Memory-specific message component that handles styling and interactions
 * for memory chat messages, including AI-specific visual indicators
 */
const PureMemoryMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  isGuidanceMode = true,
}: MemoryMessageProps) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const isAIMessage = message.role === 'assistant';

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`memory-message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {isAIMessage && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 w-full">
            {isAIMessage && isGuidanceMode && (
              <div className="flex">
                <Badge variant="outline" className="gap-1 px-1.5 py-0 text-xs">
                  <BrainIcon size={10} />
                  <span>Memory Guide</span>
                </Badge>
              </div>
            )}

            {message.parts?.map((part, index) => {
              if (part.type !== 'text') return null;

              const key = `memory-message-${message.id}-part-${index}`;

              if (mode === 'view') {
                return (
                  <div key={key} className="flex flex-row gap-2 items-start">
                    {message.role === 'user' && !isReadonly && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            data-testid="message-edit-button"
                            variant="ghost"
                            className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                            onClick={() => {
                              setMode('edit');
                            }}
                          >
                            <PencilEditIcon />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit message</TooltipContent>
                      </Tooltip>
                    )}

                    <div
                      data-testid="message-content"
                      className={cn('flex flex-col gap-4', {
                        'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                          message.role === 'user',
                      })}
                    >
                      <Markdown>{part.text}</Markdown>
                    </div>
                  </div>
                );
              }

              if (mode === 'edit') {
                return (
                  <div key={key} className="flex flex-row gap-2 items-start">
                    <div className="size-8" />

                    <MessageEditor
                      key={message.id}
                      message={message}
                      setMode={setMode}
                      setMessages={setMessages}
                      reload={reload}
                    />
                  </div>
                );
              }
            })}

            {isLoading && isAIMessage && (
              <AIMessageIndicator type="typing" className="mt-2" />
            )}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const MemoryMessage = memo(PureMemoryMessage);

/**
 * Component displayed while waiting for AI to respond
 * Used as a loading indicator when the AI is thinking
 */
export const MemoryThinkingMessage = ({
  isGuidanceMode = true,
}: {
  isGuidanceMode?: boolean;
}) => {
  return (
    <motion.div
      data-testid="memory-message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}
    >
      <div className="flex gap-4">
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          {isGuidanceMode && (
            <div className="flex">
              <Badge variant="outline" className="gap-1 px-1.5 py-0 text-xs">
                <BrainIcon size={10} />
                <span>Memory Guide</span>
              </Badge>
            </div>
          )}

          <AIMessageIndicator type="thinking" />
        </div>
      </div>
    </motion.div>
  );
};
