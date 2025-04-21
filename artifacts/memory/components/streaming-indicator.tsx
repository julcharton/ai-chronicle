export function StreamingIndicator() {
  return (
    <div className="flex items-center justify-center p-4 mb-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Creating memory blocks...</span>
      </div>
    </div>
  );
}
