'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, Wrench, ArrowRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers'

export default function ImplementationsPage() {
  const [search, setSearch] = useState('')

  const { data: implementations } = trpc.implementation.list.useQuery()

  const filtered = implementations?.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.customer?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Implementations</h1>
          <p className="text-muted-foreground mt-1">Track installation and implementation history</p>
        </div>
        <Link href="/implementations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log Implementation
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search implementations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered?.map((imp, i) => (
          <motion.div
            key={imp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/implementations/${imp.id}`}>
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{imp.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{imp.customer?.name}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(imp.implementDate).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{imp.description || 'No description'}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Engineer</span>
                      <span>{imp.engineerName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Assets</span>
                      <span>{imp._count?.assets || 0}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-primary">
                    View Details <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered?.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No implementations found</h3>
          <p className="text-muted-foreground">Log your first implementation</p>
        </div>
      )}
    </div>
  )
}
