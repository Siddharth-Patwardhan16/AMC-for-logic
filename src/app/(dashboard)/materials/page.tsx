'use client'

import { useState } from 'react'
import { Search, Package, Boxes } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import { trpc } from '@/components/providers'
import { useCompany } from '@/components/company/company-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useListPage } from '@/hooks/use-list-page'
import { ListPagination } from '@/components/ui/list-pagination'

const categoryLabels: Record<string, string> = {
  SPARE_PART: 'Spare Part',
  CONSUMABLE: 'Consumable',
  CABLE: 'Cable',
  TOOL: 'Tool',
  OTHER: 'Other',
}

const statusColors: Record<string, string> = {
  IN_STOCK: 'text-[#22C55E] bg-[#22C55E]/10',
  LOW_STOCK: 'text-[#EAB308] bg-[#EAB308]/10',
  OUT_OF_STOCK: 'text-[#EF4444] bg-[#EF4444]/10',
  DISCONTINUED: 'text-[#A1A1AA] bg-[#171717]',
}

export default function MaterialsPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { companyFilter } = useCompany()
  const { page, setPage } = useListPage(debouncedSearch, companyFilter)
  const { data } = trpc.material.list.useQuery({
    companyId: companyFilter,
    search: debouncedSearch || undefined,
    page,
  })
  const materials = data?.items ?? []

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Materials</h1>
        <p className="text-sm text-[#A1A1AA] mt-1">Spare parts and consumables inventory</p>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((material, i) => (
          <FadeIn
            key={material.id}
            staggerIndex={i % 6}
            className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-[#4F8CFF]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{material.name}</p>
                  <p className="text-xs text-[#52525B]">{material.sku}</p>
                </div>
              </div>
              <Badge className={statusColors[material.status] ?? statusColors.OTHER}>
                {material.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#A1A1AA]">
                <span>Category</span>
                <span className="text-white">{categoryLabels[material.category] || material.category}</span>
              </div>
              <div className="flex justify-between text-[#A1A1AA]">
                <span>Stock</span>
                <span className="text-white">{material.quantity} {material.unit}</span>
              </div>
              <div className="flex justify-between text-[#A1A1AA]">
                <span>Unit price</span>
                <span className="text-white">₹{Number(material.unitPrice).toFixed(2)}</span>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {materials.length === 0 && (
        <div className="text-center py-16">
          <Boxes className="h-12 w-12 text-[#52525B] mx-auto mb-4" />
          <p className="text-sm text-[#A1A1AA]">No materials found</p>
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
