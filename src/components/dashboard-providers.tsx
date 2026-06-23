'use client'

import { TRPCProvider } from '@/components/providers'

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return <TRPCProvider>{children}</TRPCProvider>
}
