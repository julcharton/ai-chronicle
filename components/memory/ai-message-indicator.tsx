'use client';

import { memo } from 'react';
import { SparklesIcon } from '../icons';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * Types of AI indicators that can be displayed
 */
export type AIIndicatorType = 'thinking' | 'typing' | 'waiting' | 'processing';

interface AIMessageIndicatorProps {
  type: AIIndicatorType;
  message?: string;
  className?: string;
}

/**
 * Component that displays different visual indicators for AI states
 * Used to provide feedback about AI processing status in the memory chat
 */
const PureAIMessageIndicator = ({
  type,
  message,
  className,
}: AIMessageIndicatorProps) => {
  // Default messages for different indicator types
  const defaultMessages: Record<AIIndicatorType, string> = {
    thinking: 'Thinking...',
    typing: 'Typing...',
    waiting: 'Waiting for your input...',
    processing: 'Processing your request...',
  };

  // Default animations for different indicator types
  const animations = {
    thinking: {
      opacity: [0.4, 1, 0.4],
      scale: [0.97, 1, 0.97],
      transition: { duration: 2, repeat: Number.POSITIVE_INFINITY },
    },
    typing: {
      width: ['0%', '100%'],
      transition: { duration: 1.5, repeat: Number.POSITIVE_INFINITY },
    },
    waiting: {
      opacity: [0.6, 1, 0.6],
      transition: { duration: 1.5, repeat: Number.POSITIVE_INFINITY },
    },
    processing: {
      rotate: [0, 360],
      transition: {
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'linear',
      },
    },
  };

  // Text content to display (use provided message or default)
  const displayText = message || defaultMessages[type];

  return (
    <motion.div
      data-testid={`ai-indicator-${type}`}
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground rounded-md',
        className,
      )}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-center h-6 w-6 rounded-full">
        {type === 'processing' ? (
          <motion.div animate={animations.processing}>
            <SparklesIcon size={14} />
          </motion.div>
        ) : (
          <SparklesIcon size={14} />
        )}
      </div>

      <div className="flex flex-col w-full">
        <div className="flex items-center">
          <span>{displayText}</span>
        </div>

        {type === 'typing' && (
          <motion.div
            className="h-0.5 bg-primary/20 mt-1 rounded-full"
            animate={animations.typing}
          />
        )}

        {type === 'thinking' && (
          <motion.div className="flex gap-1 mt-1" animate={animations.thinking}>
            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export const AIMessageIndicator = memo(PureAIMessageIndicator);
