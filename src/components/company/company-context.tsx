'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'amc-selected-company-id'
const COOKIE_NAME = 'selectedCompanyId'

type CompanyContextValue = {
  /** null = all companies */
  selectedCompanyId: string | null
  setSelectedCompanyId: (id: string | null) => void
  /** undefined when viewing all companies — pass to tRPC list filters */
  companyFilter: string | undefined
  isAllCompanies: boolean
}

const CompanyContext = createContext<CompanyContextValue | null>(null)

function readStoredCompanyId(): string | null {
  if (typeof window === 'undefined') return null
  const fromStorage = localStorage.getItem(STORAGE_KEY)
  return fromStorage || null
}

function persistCompanyId(id: string | null) {
  if (typeof window === 'undefined') return
  if (id) {
    localStorage.setItem(STORAGE_KEY, id)
    document.cookie = `${COOKIE_NAME}=${id}; path=/; max-age=31536000; SameSite=Lax`
  } else {
    localStorage.removeItem(STORAGE_KEY)
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
  }
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSelectedCompanyIdState(readStoredCompanyId())
    setHydrated(true)
  }, [])

  const setSelectedCompanyId = useCallback((id: string | null) => {
    setSelectedCompanyIdState(id)
    persistCompanyId(id)
  }, [])

  const value = useMemo<CompanyContextValue>(() => ({
    selectedCompanyId: hydrated ? selectedCompanyId : null,
    setSelectedCompanyId,
    companyFilter: selectedCompanyId ?? undefined,
    isAllCompanies: !selectedCompanyId,
  }), [hydrated, selectedCompanyId, setSelectedCompanyId])

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider')
  return ctx
}

/** Safe hook for pages that may render outside provider during SSR */
export function useCompanyFilter() {
  const ctx = useContext(CompanyContext)
  return {
    companyId: ctx?.companyFilter,
    isAllCompanies: ctx?.isAllCompanies ?? true,
    selectedCompanyId: ctx?.selectedCompanyId ?? null,
  }
}
