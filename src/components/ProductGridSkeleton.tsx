/** Esqueleto con la misma forma que ProductCard: así la página no "salta" cuando llegan los datos. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-box bg-white">
          <div className="aspect-[4/3] animate-pulse bg-zinc-200/70" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="flex items-center justify-between pt-3">
              <div className="h-7 w-24 animate-pulse rounded bg-zinc-100" />
              <div className="h-10 w-24 animate-pulse rounded-box bg-zinc-100" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
