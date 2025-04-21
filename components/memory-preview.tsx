import type { ArtifactKind } from '@/components/artifact';
import { useArtifact } from '@/hooks/use-artifact';
import type { Document } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { FileIcon, PenIcon, LoaderIcon } from './icons';
import { cn } from '@/lib/utils';
import { toast } from './toast';

// Simple loading skeleton as a placeholder
function LoadingSkeleton({ artifactKind }: { artifactKind: string }) {
  return (
    <div className="animate-pulse flex space-x-4 w-full p-4 border rounded-lg">
      <div className="flex-1 space-y-4 py-1">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

interface MemoryPreviewProps {
  isReadonly: boolean;
  result?: { id: string; title: string; kind: ArtifactKind };
  args?: { title: string; theme?: string; timeframe?: string };
}

export function MemoryPreview({
  isReadonly,
  result,
  args,
}: MemoryPreviewProps) {
  const { artifact, setArtifact } = useArtifact();
  const hitboxRef = useRef<HTMLDivElement>(null);

  const { data: documents, isLoading: isDocumentsFetching } = useSWR<
    Array<Document>
  >(result ? `/api/document?id=${result.id}` : null, fetcher);

  const previewDocument = useMemo(() => documents?.[0], [documents]);

  useEffect(() => {
    const boundingBox = hitboxRef.current?.getBoundingClientRect();

    if (artifact.documentId && boundingBox) {
      setArtifact((artifact) => ({
        ...artifact,
        boundingBox: {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      }));
    }
  }, [artifact.documentId, setArtifact]);

  if (artifact.isVisible) {
    if (result) {
      return (
        <div ref={hitboxRef}>
          <div className="cursor-pointer border py-2 px-3 rounded-xl flex flex-row items-start justify-between gap-3">
            <div className="flex flex-row gap-3 items-start">
              <div className="text-primary mt-1">
                <FileIcon />
              </div>
              <div className="text-left">
                <div className="font-medium">Memory: {result.title}</div>
                <div className="text-sm text-muted-foreground">
                  Click to view and edit memory
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (args) {
      return (
        <div ref={hitboxRef}>
          <div className="cursor-pointer border py-2 px-3 rounded-xl flex flex-row items-start justify-between gap-3">
            <div className="flex flex-row gap-3 items-start">
              <div className="text-primary mt-1">
                <FileIcon />
              </div>
              <div className="text-left">
                <div className="font-medium">Creating Memory: {args.title}</div>
                <div className="text-sm text-muted-foreground">
                  {args.theme && `Theme: ${args.theme}`}
                  {args.theme && args.timeframe && ' • '}
                  {args.timeframe && `Time period: ${args.timeframe}`}
                </div>
              </div>
            </div>
            <div className="animate-spin mt-1">{<LoaderIcon />}</div>
          </div>
        </div>
      );
    }
  }

  if (isDocumentsFetching) {
    return <LoadingSkeleton artifactKind="memory" />;
  }

  const document = previewDocument || null;

  if (!document) return <LoadingSkeleton artifactKind="memory" />;

  return (
    <div
      className="cursor-pointer w-fit border py-2 px-3 rounded-xl flex flex-row items-start justify-between gap-3"
      ref={hitboxRef}
      onClick={(event) => {
        if (isReadonly) {
          toast({
            type: 'error',
            description:
              'Viewing memory artifacts in shared chats is currently not supported.',
          });
          return;
        }

        const rect = event.currentTarget.getBoundingClientRect();

        const boundingBox = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        setArtifact({
          ...artifact,
          title: document.title,
          content: document.content || '',
          documentId: document.id,
          kind: 'memory' as ArtifactKind,
          isVisible: true,
          boundingBox,
          status: 'idle',
        });
      }}
    >
      <div className="flex flex-row gap-3 items-start">
        <div className="text-primary mt-1">
          <FileIcon />
        </div>

        <div className="text-left">
          <div className="font-medium">Memory: {document.title}</div>
          <div className="text-sm text-muted-foreground">
            Created {new Date(document.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="text-muted-foreground mt-1">
        <PenIcon />
      </div>
    </div>
  );
}
