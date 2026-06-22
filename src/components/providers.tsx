'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { type AppRouter } from '@/server/trpc/router'
import { CompanyProvider } from '@/components/company/company-context'

export const trpc = createTRPCReact<AppRouter>()

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers() {
            return {
              'x-trpc-source': 'react',
            }
          },
        }),
      ],
    })
  )

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <CompanyProvider>
            {children}
          </CompanyProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  )
}
