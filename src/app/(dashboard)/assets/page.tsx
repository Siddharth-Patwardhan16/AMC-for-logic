'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, HardDrive, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/ui/fade-in'
import { trpc } from '@/components/providers'
import { useCompany } from '@/components/company/company-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useListPage } from '@/hooks/use-list-page'
import { ListPagination } from '@/components/ui/list-pagination'

const typeColors: Record<string, string> = {
  SERVER: 'text-[#4F8CFF] bg-[#4F8CFF]/10',
  DESKTOP: 'text-[#A855F7] bg-[#A855F7]/10',
  LAPTOP: 'text-[#22C55E] bg-[#22C55E]/10',
  THIN_CLIENT: 'text-[#EAB308] bg-[#EAB308]/10',
  FIREWALL: 'text-[#EF4444] bg-[#EF4444]/10',
  SWITCH: 'text-[#06B6D4] bg-[#06B6D4]/10',
  ROUTER: 'text-[#F97316] bg-[#F97316]/10',
  UPS: 'text-[#8B5CF6] bg-[#8B5CF6]/10',
  STORAGE: 'text-[#EC4899] bg-[#EC4899]/10',
  PRINTER: 'text-[#14B8A6] bg-[#14B8A6]/10',
  CCTV: 'text-[#6366F1] bg-[#6366F1]/10',
  BIOMETRIC: 'text-[#84CC16] bg-[#84CC16]/10',
  ACCESS_CONTROL: 'text-[#D946EF] bg-[#D946EF]/10',
  OTHER: 'text-[#A1A1AA] bg-[#171717]',
}

export default function AssetsPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [assetType, setAssetType] = useState('')
  const [status, setStatus] = useState('')
  const { companyFilter } = useCompany()
  const { page, setPage } = useListPage(debouncedSearch, assetType, status, companyFilter)

  const { data } = trpc.asset.list.useQuery({
    companyId: companyFilter,
    assetType: assetType || undefined,
    status: status || undefined,
    search: debouncedSearch || undefined,
    page,
  })
  const assets = data?.items ?? []

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Assets</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">{data?.total ?? 0} under management</p>
        </div>
        <Link href="/assets/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-sm font-medium transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            New Asset
          </button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
          <Input
            placeholder="Search by name, serial, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={assetType}
          onChange={(e) => setAssetType(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#111111] border border-[#262626] text-sm text-[#A1A1AA] focus:outline-none focus:border-[#4F8CFF]/30"
        >
          <option value="">All Types</option>
          <option value="SERVER">Server</option>
          <option value="DESKTOP">Desktop</option>
          <option value="LAPTOP">Laptop</option>
          <option value="FIREWALL">Firewall</option>
          <option value="SWITCH">Switch</option>
          <option value="UPS">UPS</option>
          <option value="PRINTER">Printer</option>
          <option value="CCTV">CCTV</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset, i) => (
          <FadeIn key={asset.id} staggerIndex={i % 6}>
            <Link href={`/assets/${asset.id}`}>
              <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all duration-300 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                      <HardDrive className="h-5 w-5 text-[#22C55E]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{asset.name}</p>
                      <p className="text-xs text-[#52525B]">{asset.serialNumber}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${typeColors[asset.assetType] || typeColors.OTHER}`}>
                    {asset.assetType.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
                  <span className="text-xs text-[#A1A1AA]">{asset.customer?.name}</span>
                  <ArrowRight className="h-4 w-4 text-[#52525B] group-hover:text-[#4F8CFF] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Link>
          </FadeIn>
        ))}
      </div>

      {assets.length === 0 && (
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-[#171717] flex items-center justify-center mx-auto mb-4">
            <HardDrive className="h-5 w-5 text-[#52525B]" />
          </div>
          <p className="text-sm text-[#A1A1AA]">No assets found</p>
          <p className="text-xs text-[#52525B] mt-1">Add your first asset</p>
        </div>
      )}

      <ListPagination
        page={page}
        totalPages={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        pageSize={data?.pageSize ?? 24}
        onPageChange={setPage}
      />
    </div>
  )
}
