export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
  );
}

/** 영화 목록 카드 스켈레톤 */
export function MovieCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <Skeleton className="h-36 w-24 shrink-0" />
      <div className="flex-1 space-y-2 py-0.5">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

/** 영화 상세 + 상영 일정 스켈레톤 */
export function MovieDetailSkeleton() {
  return (
    <div>
      <div className="mb-8 flex gap-6 rounded-lg border border-gray-200 bg-white p-6">
        <Skeleton className="h-56 w-36 shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
      <Skeleton className="mb-4 h-5 w-24" />
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-2 h-3 w-20" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className="h-16 w-20" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 좌석 선택 페이지 스켈레톤 */
export function ScreeningSkeleton() {
  return (
    <div>
      <Skeleton className="mb-6 h-16 w-full rounded-lg" />
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <Skeleton className="mb-6 h-6 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-8 w-5" />
              {[...Array(8)].map((_, j) => (
                <Skeleton key={j} className="h-8 w-8" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 예매 내역 스켈레톤 */
export function ReservationSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
