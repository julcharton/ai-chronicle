'use client';

import { TwoColumnLayout } from './two-column-layout';

/**
 * Demo component to showcase the TwoColumnLayout with placeholder content
 */
export function TwoColumnLayoutDemo() {
  return (
    <TwoColumnLayout
      leftContent={<LeftColumnPlaceholder />}
      rightContent={<RightColumnPlaceholder />}
      leftColumnTitle="Memory Editor"
      rightColumnTitle="Memory Chat"
    />
  );
}

function LeftColumnPlaceholder() {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-semibold">Memory Editor</div>
        <div className="text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-md lg:hidden">
          Tap "Memory Chat" to view chat
        </div>
      </div>
      <div className="flex-1 border rounded-md p-4 bg-muted/20">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

function RightColumnPlaceholder() {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-semibold">Memory Chat</div>
        <div className="text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-md lg:hidden">
          Tap "Memory Editor" to view editor
        </div>
      </div>
      <div className="flex-1 border rounded-md p-4 bg-muted/20">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="p-3 bg-muted rounded-lg w-3/4">
                    <div className="h-4 bg-muted/50 rounded w-full" />
                    <div className="h-4 bg-muted/50 rounded w-5/6 mt-2" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <div className="flex-1 space-y-2 text-right">
                  <div className="h-4 bg-muted rounded w-24 ml-auto" />
                  <div className="p-3 bg-primary/10 rounded-lg w-3/4 ml-auto">
                    <div className="h-4 bg-muted/50 rounded w-full" />
                    <div className="h-4 bg-muted/50 rounded w-4/5 mt-2 ml-auto" />
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20" />
              </div>
            </div>
          </div>

          <div className="mt-4 border rounded-md p-2 flex gap-2">
            <div className="flex-1 h-10 bg-muted rounded" />
            <div className="w-10 h-10 bg-primary rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
