'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { BookOpenIcon, CalendarIcon, Globe, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MemoryCardProps {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isPublic?: boolean;
  summary?: string;
  onClick?: () => void;
}

/**
 * Card component that displays a memory with title, summary, and metadata
 */
export function MemoryCard({
  id,
  title,
  content,
  createdAt,
  updatedAt,
  tags = [],
  isPublic = false,
  summary = '',
  onClick,
}: MemoryCardProps) {
  const [hovering, setHovering] = useState(false);

  // Use the summary if provided, otherwise extract from content
  const displaySummary = summary || extractSummary(content, 120);

  // Format the time since creation
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <Link href={`/memories/${id}`} className="block">
      <Card
        className={cn(
          'transition-all duration-200 cursor-pointer h-full',
          hovering && 'shadow-md scale-[1.01]',
        )}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="line-clamp-1 text-lg mr-2">
              {title || 'Untitled Memory'}
            </CardTitle>
            {isPublic ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span className="text-xs">Public</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span className="text-xs">Private</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {displaySummary || 'No content'}
          </p>

          <div className="flex flex-wrap justify-between items-center mt-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>{timeAgo}</span>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Extract a summary from the memory content
 */
function extractSummary(content: string, maxLength: number): string {
  if (!content) return '';

  // Remove HTML tags if present
  let text = content.replace(/<[^>]*>?/gm, '');

  // Trim and limit length
  text = text.trim();
  if (text.length <= maxLength) return text;

  // Find a good break point
  const breakPoint = text.lastIndexOf(' ', maxLength);
  return `${text.substring(0, breakPoint > 0 ? breakPoint : maxLength)}...`;
}
