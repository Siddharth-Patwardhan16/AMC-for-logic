'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, FolderOpen, File, Image, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/components/providers'

const fileTypeIcons: Record<string, any> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileText,
  xlsx: FileText,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  default: File,
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('')

  const { data: documents } = trpc.document.list.useQuery()

  const filtered = documents?.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Vault</h1>
        <p className="text-muted-foreground mt-1">Store and manage all your documents</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {filtered?.map((doc, i) => {
          const ext = doc.fileType.toLowerCase()
          const Icon = fileTypeIcons[ext] || fileTypeIcons.default
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                <Card className="card-hover cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.fileType.toUpperCase()} · v{doc.version}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          )
        })}
      </div>

      {filtered?.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No documents found</h3>
          <p className="text-muted-foreground">Upload your first document</p>
        </div>
      )}
    </div>
  )
}
