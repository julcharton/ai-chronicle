'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TwoColumnLayoutProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  className?: string;
  leftColumnClassName?: string;
  rightColumnClassName?: string;
  leftColumnTitle?: string;
  rightColumnTitle?: string;
}

/**
 * TwoColumnLayout component providing a responsive 60/40 split layout for desktop view
 * Left column (60%) is typically used for an editor, while right column (40%) is for chat
 *
 * On mobile, the layout stacks with toggle controls to switch between views
 */
export function TwoColumnLayout({
  leftContent,
  rightContent,
  className,
  leftColumnClassName,
  rightColumnClassName,
  leftColumnTitle = 'Editor',
  rightColumnTitle = 'Chat',
}: TwoColumnLayoutProps) {
  // State to track which view is active on mobile
  const [activeView, setActiveView] = useState<'left' | 'right'>('left');

  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-5 h-full w-full overflow-hidden',
        className,
      )}
    >
      {/* Mobile View Toggle Controls - Only visible on mobile */}
      <div className="flex lg:hidden border-b p-2 mb-0 sticky top-0 bg-background z-10 shrink-0">
        <div className="flex w-full rounded-md overflow-hidden">
          <Button
            variant={activeView === 'left' ? 'default' : 'outline'}
            className={cn(
              'flex-1 rounded-none',
              activeView === 'left' ? 'shadow-sm' : 'text-muted-foreground',
            )}
            onClick={() => setActiveView('left')}
          >
            {leftColumnTitle}
          </Button>
          <Button
            variant={activeView === 'right' ? 'default' : 'outline'}
            className={cn(
              'flex-1 rounded-none',
              activeView === 'right' ? 'shadow-sm' : 'text-muted-foreground',
            )}
            onClick={() => setActiveView('right')}
          >
            {rightColumnTitle}
          </Button>
        </div>
      </div>

      {/* Left Column - 60% width (3/5 columns) on desktop, conditional on mobile */}
      <div
        className={cn(
          'col-span-1 lg:col-span-3 border-b lg:border-b-0 lg:border-r h-full overflow-hidden',
          // On mobile: show when active, hide when inactive
          activeView === 'left' ? 'block' : 'hidden lg:block',
          leftColumnClassName,
        )}
      >
        {leftContent}
      </div>

      {/* Right Column - 40% width (2/5 columns) on desktop, conditional on mobile */}
      <div
        className={cn(
          'col-span-1 lg:col-span-2 h-full overflow-hidden',
          // On mobile: show when active, hide when inactive
          activeView === 'right' ? 'block' : 'hidden lg:block',
          rightColumnClassName,
        )}
      >
        {rightContent}
      </div>
    </div>
  );
}
