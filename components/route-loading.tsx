import { Skeleton } from "@/components/ui/skeleton";

export function RouteLoading() {
  return (
    <div className="mx-auto flex w-full max-w-reading flex-col gap-4 px-4 py-8 sm:px-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}
