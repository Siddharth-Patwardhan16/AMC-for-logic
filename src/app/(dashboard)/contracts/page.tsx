'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/components/providers'

const contractTypeLabels: Record<string, string> = {
  QUARTERLY_AMC: 'Quarterly AMC',
  HALF_YEARLY_AMC: 'Half Yearly AMC',
  YEARLY_AMC: 'Yearly AMC',
  MONTHLY_SUPPORT: 'Monthly Support',
  PROJECT_BASED: 'Project Based',
  NON_AMC: 'Non AMC',
}

const contractStatusColors: Record<string, string> = {
  ACTIVE: 'success',
  EXPIRED: 'destructive',
  TERMINATED: 'secondary',
  PENDING_RENEWAL: 'warning',
}

export default function ContractsPage() {
  const [search, setSearch] = useState('')
  const [contractType, setContractType] = useState('')
  const [status, setStatus] = useState('')

  const { data: contracts } = trpc.contract.list.useQuery({
    contractType: contractType || undefined,
    status: status || undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground mt-1">Manage AMC contracts and service agreements</p>
        </div>
        <Link href="/contracts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {Object.keys(contractTypeLabels).map((type) => (
                  <SelectItem key={type} value={type}>{contractTypeLabels[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
                <SelectItem value="PENDING_RENEWAL">Pending Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contracts?.map((contract, i) => (
          <motion.div
            key={contract.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/contracts/${contract.id}`}>
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{contract.contractNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground">{contract.customer?.name}</p>
                      </div>
                    </div>
                    <Badge variant={contractStatusColors[contract.status] as any}>
                      {contract.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span>{contractTypeLabels[contract.contractType]}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Value</span>
                      <span>₹{Number(contract.value).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Start</span>
                      <span>{new Date(contract.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">End</span>
                      <span>{new Date(contract.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Assets</span>
                      <span>{contract._count?.assets || 0}</span>
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

      {contracts?.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No contracts found</h3>
          <p className="text-muted-foreground">Create your first contract</p>
        </div>
      )}
    </div>
  )
}
