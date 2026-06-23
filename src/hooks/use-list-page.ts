import { useEffect, useState } from 'react'

/** Manages list page number and resets to page 1 when filters change. */
export function useListPage(...filterDeps: unknown[]) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when any filter dep changes
  }, filterDeps)

  return { page, setPage }
}
