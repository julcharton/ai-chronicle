import { TwoColumnLayoutDemo } from '@/components/layout/two-column-layout-demo';

export default function TwoColumnDemoPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Two Column Layout Demo</h1>
        <p className="text-muted-foreground">
          60/40 split layout for desktop view with responsive design
        </p>
        <div className="mt-2 text-sm">
          <span className="bg-muted/60 px-2 py-1 rounded-md inline-block mb-1 mr-2">
            Desktop: Side-by-side columns (60/40 split)
          </span>
          <span className="bg-muted/60 px-2 py-1 rounded-md inline-block mb-1">
            Mobile: Toggle tabs for switching views
          </span>
        </div>
      </div>

      {/* Responsive view indicators */}
      <div className="hidden lg:flex justify-center items-center py-1 bg-primary/10 text-primary text-sm font-medium">
        Currently viewing in desktop mode
      </div>
      <div className="lg:hidden flex justify-center items-center py-1 bg-primary/10 text-primary text-sm font-medium">
        Currently viewing in mobile mode
      </div>

      <div className="flex-1">
        <TwoColumnLayoutDemo />
      </div>
    </div>
  );
}
