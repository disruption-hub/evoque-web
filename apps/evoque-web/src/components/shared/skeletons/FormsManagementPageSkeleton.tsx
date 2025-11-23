import { Skeleton } from '@/components/ui/skeleton';

export function FormsManagementPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-9 w-16" />
                </div>
                <Skeleton className="h-14 w-14 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Forms Content Skeleton */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

