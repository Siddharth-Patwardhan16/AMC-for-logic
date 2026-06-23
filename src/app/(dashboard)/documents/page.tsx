'use client'

import { useState } from 'react'
import { Search, FolderOpen, File, Image, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/ui/fade-in'
import { trpc } from '@/components/providers'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useListPage } from '@/hooks/use-list-page'
import { ListPagination } from '@/components/ui/list-pagination'

const fileIcons: Record<string, any> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileText,
  xlsx: FileText,
  png: Image,
  jpg: Image,
  jpeg: Image,
  default: File,
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { page, setPage } = useListPage(debouncedSearch)

  const { data } = trpc.document.list.useQuery({
    search: debouncedSearch || undefined,
    page,
  })
  const documents = data?.items ?? []

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Documents</h1>
        <p className="text-sm text-[#A1A1AA] mt-1">Files & attachments</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documents.map((doc: any, i: number) => {
          const ext = doc.fileType.toLowerCase()
          const Icon = fileIcons[ext] || fileIcons.default
          return (
            <FadeIn key={doc.id} staggerIndex={i % 6}>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all duration-300 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#171717] flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-[#A1A1AA]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                      <p className="text-[10px] text-[#52525B] mt-0.5">{doc.fileType.toUpperCase()} · v{doc.version}</p>
                    </div>
                  </div>
                </div>
              </a>
            </FadeIn>
          )
        })}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-[#171717] flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-5 w-5 text-[#52525B]" />
          </div>
          <p className="text-sm text-[#A1A1AA]">No documents found</p>
          <p className="text-xs text-[#52525B] mt-1">Upload your first document</p>
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
