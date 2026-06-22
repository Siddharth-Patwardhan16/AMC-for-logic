'use client'

import { useEffect } from 'react'
import { trpc } from '@/components/providers'
import { useCompany } from './company-context'

/** Clear stored company filter when it points at a deleted or unknown company. */
export function CompanyFilterSync() {
  const { selectedCompanyId, setSelectedCompanyId } = useCompany()
  const { data: companies } = trpc.company.list.useQuery()

  useEffect(() => {
    if (selectedCompanyId == null || companies == null) return
    if (!companies.some((company) => company.id === selectedCompanyId)) {
      setSelectedCompanyId(null)
    }
  }, [selectedCompanyId, companies, setSelectedCompanyId])

  return null
}
