'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, ArrowRight, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/components/providers'

const assetTypeIcons: Record<string, string> = {
  SERVER: 'Server',
  DESKTOP: 'Desktop',
  LAPTOP: 'Laptop',
  THIN_CLIENT: 'Thin Client',
  FIREWALL: 'Firewall',
  SWITCH: 'Switch',
  ROUTER: 'Router',
  UPS: 'UPS',
  STORAGE: 'Storage',
  PRINTER: 'Printer',
  CCTV: 'CCTV',
  BIOMETRIC: 'Biometric',
  ACCESS_CONTROL: 'Access Control',
  OTHER: 'Other',
}

const assetStatusColors: Record<string, string> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  UNDER_MAINTENANCE: 'warning',
  DECOMMISSIONED: 'destructive',
  WARANTY_EXPIRED: 'destructive',
}

export default function AssetsPage() {
  const [search, setSearch] = useState('')
  const [assetType, setAssetType] = useState('')
  const [status, setStatus] = useState('')

  const { data: assets } = trpc.asset.list.useQuery({
    assetType: assetType || undefined,
    status: status || undefined,
    search: search || undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground mt-1">Track and manage IT assets across all customers</p>
        </div>
        <Link href="/assets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, serial, model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {Object.keys(assetTypeIcons).map((type) => (
                  <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
                <SelectItem value="WARANTY_EXPIRED">Warranty Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets?.map((asset, i) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/assets/${asset.id}`}>
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <HardDrive className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{asset.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{asset.serialNumber}</p>
                      </div>
                    </div>
                    <Badge variant={assetStatusColors[asset.status] as any}>
                      {asset.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span>{asset.assetType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Customer</span>
                      <span>{asset.customer?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Model</span>
                      <span>{asset.model || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tickets</span>
                      <span>{asset._count?.tickets || 0}</span>
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

      {assets?.length === 0 && (
        <div className="text-center py-12">
          <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No assets found</h3>
          <p className="text-muted-foreground">Add your first asset to get started</p>
        </div>
      )}
    </div>
  )
}
