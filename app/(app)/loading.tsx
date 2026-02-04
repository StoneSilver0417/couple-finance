export default function Loading() {
  return (
    <div className="flex-1 w-full animate-pulse">
      {/* Header Skeleton */}
      <header className="flex items-center gap-4 p-6 pt-10">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-6 w-24 bg-gray-200 rounded" />
        </div>
      </header>

      <div className="px-6 space-y-6">
        {/* Main Card Skeleton */}
        <div className="glass-panel w-full rounded-[2.5rem] p-6 shadow-glass">
          <div className="flex flex-col items-center">
            <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
            <div className="h-10 w-40 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="h-20 bg-gray-100 rounded-2xl" />
              <div className="h-20 bg-gray-100 rounded-2xl" />
            </div>
          </div>
        </div>

        {/* List Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel p-4 rounded-[1.5rem] flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-2xl bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
