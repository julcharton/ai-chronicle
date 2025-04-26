import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClockRewind as CalendarIcon } from '@/components/icons';
import Link from 'next/link';
import type { Memory } from '@/lib/types';

interface MemoryCardProps {
  memory: Memory;
}

export function MemoryCard({ memory }: MemoryCardProps) {
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>{memory.title}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <CalendarIcon size={12} />
          <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm">{memory.content}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" asChild className="w-full">
          <Link href={`/memories/${memory.id}`}>View Memory</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
