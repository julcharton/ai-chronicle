'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Check, AlertCircle } from 'lucide-react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveStatusProps {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  error?: string;
  className?: string;
}

export function AutoSaveStatus({
  status,
  lastSavedAt,
  error,
  className,
}: AutoSaveStatusProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'idle':
        return lastSavedAt
          ? `Last saved at ${formatTime(lastSavedAt)}`
          : 'No changes to save';
      case 'saving':
        return 'Saving changes...';
      case 'saved':
        return lastSavedAt
          ? `Saved at ${formatTime(lastSavedAt)}`
          : 'All changes saved';
      case 'error':
        return error || 'Error saving changes';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin mr-1" />;
      case 'saved':
        return <Check className="h-4 w-4 mr-1" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 mr-1 text-destructive" />;
      default:
        return null;
    }
  };

  const statusClasses = cn(
    'flex items-center text-xs',
    {
      'text-muted-foreground': status === 'idle' || status === 'saving',
      'text-green-500': status === 'saved',
      'text-destructive': status === 'error',
    },
    className,
  );

  return (
    <div className={statusClasses}>
      {getStatusIcon()}
      <span>{getStatusMessage()}</span>
    </div>
  );
}
