'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PanelRightOpenIcon, PanelLeftOpenIcon } from 'lucide-react';

interface TwoColumnLayoutProps {
  leftColumnTitle?: React.ReactNode;
  rightColumnTitle?: React.ReactNode;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  defaultRightOpen?: boolean;
}

/**
 * TwoColumnLayout component providing a responsive 60/40 split layout for desktop view
 * Left column (60%) is typically used for an editor, while right column (40%) is for chat
 *
 * On mobile, the layout stacks with toggle controls to switch between views
 */
export function TwoColumnLayout({
  leftColumnTitle,
  rightColumnTitle,
  leftContent,
  rightContent,
  defaultRightOpen = false,
}: TwoColumnLayoutProps) {
  const [showRightColumn, setShowRightColumn] = useState(defaultRightOpen);

  // Toggle the visible column in mobile view
  const toggleRightColumn = () => {
    setShowRightColumn(!showRightColumn);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Header/Toggle */}
      <div className="md:hidden border-b flex items-center justify-between p-2">
        {(leftColumnTitle || rightColumnTitle) && (
          <h3 className="font-medium text-sm">
            {showRightColumn ? rightColumnTitle : leftColumnTitle}
          </h3>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleRightColumn}
          title={
            showRightColumn ? 'Switch to Editor View' : 'Switch to Chat View'
          }
          className={!leftColumnTitle && !rightColumnTitle ? 'ml-auto' : ''}
        >
          {showRightColumn ? <PanelLeftOpenIcon /> : <PanelRightOpenIcon />}
        </Button>
      </div>

      {/* Desktop & Mobile Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column */}
        <div
          className={cn(
            'flex-1 flex flex-col h-full overflow-hidden',
            showRightColumn ? 'hidden md:flex md:w-3/5' : 'w-full',
          )}
        >
          {leftColumnTitle && (
            <div className="hidden md:block border-b p-2">
              <h3 className="font-medium text-sm">{leftColumnTitle}</h3>
            </div>
          )}
          <div className="flex-1 overflow-auto">{leftContent}</div>
        </div>

        {/* Right Column */}
        <div
          className={cn(
            'flex-1 flex flex-col h-full overflow-hidden border-l',
            !showRightColumn ? 'hidden md:flex md:w-2/5' : 'w-full',
          )}
        >
          {rightColumnTitle && (
            <div className="hidden md:block border-b p-2">
              <h3 className="font-medium text-sm">{rightColumnTitle}</h3>
            </div>
          )}
          <div className="flex-1 overflow-auto">{rightContent}</div>
        </div>
      </div>
    </div>
  );
}
