/** Shared React Query options — reduces redundant refetches across navigations. */
export const staticDataQueryOptions = {
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
} as const

export const listQueryOptions = {
  staleTime: 60_000,
  gcTime: 10 * 60_000,
} as const
