'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, Wrench, Calendar, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { trpc } from '@/components/providers'

export default function ImplementationsPage() {
  const [search, setSearch] = useState('')

  const { data: implementations } = trpc.implementation.list.useQuery()

  const filtered = implementations?.filter((i: any) =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.customer?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Implementations</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Installation & project history</p>
        </div>
        <Link href="/implementations/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-sm font-medium transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            Log Implementation
          </button>
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
        <Input
          placeholder="Search implementations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered?.map((imp: any, i: number) => (
          <motion.div
            key={imp.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <Link href={`/implementations/${imp.id}`}>
              <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all duration-300 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-[#3B82F6]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{imp.title}</p>
                      <p className="text-xs text-[#52525B]">{imp.customer?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[#A1A1AA]">
                    <Calendar className="h-3 w-3" />
                    <span className="text-[10px]">{new Date(imp.implementDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
                <p className="text-xs text-[#A1A1AA] line-clamp-2 mb-3">{imp.description || 'No description'}</p>
                <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
                  <span className="text-xs text-[#52525B]">{imp.engineerName || 'No engineer'}</span>
                  <span className="text-xs text-[#52525B]">{imp._count?.assets || 0} assets</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered?.length === 0 && (
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-[#171717] flex items-center justify-center mx-auto mb-4">
            <Wrench className="h-5 w-5 text-[#52525B]" />
          </div>
          <p className="text-sm text-[#A1A1AA]">No implementations found</p>
          <p className="text-xs text-[#52525B] mt-1">Log your first implementation</p>
        </div>
      )}
    </div>
  )
}
