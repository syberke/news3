
import { Skeleton } from "@/components/ui/skeleton";

const NewsCardSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-lg border hover:shadow-lg transition-all duration-300 h-full flex flex-col bg-card animate-fade-in">
      <Skeleton className="h-48 w-full pulse" />
      <div className="p-5 flex flex-col flex-grow space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24 pulse" />
          <Skeleton className="h-4 w-8 pulse" />
        </div>
        <Skeleton className="h-6 w-full pulse" />
        <Skeleton className="h-6 w-3/4 pulse" />
        <div className="flex-grow">
          <Skeleton className="h-4 w-full pulse" />
          <Skeleton className="h-4 w-full mt-2 pulse" />
          <Skeleton className="h-4 w-2/3 mt-2 pulse" />
        </div>
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-4 w-20 pulse" />
          <Skeleton className="h-9 w-24 pulse" />
        </div>
      </div>
    </div>
  );
};

export default NewsCardSkeleton;
