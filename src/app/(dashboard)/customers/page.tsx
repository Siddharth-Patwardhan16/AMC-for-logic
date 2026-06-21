'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, ArrowRight, Users, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/components/providers'
import { toast } from 'sonner'

const customerStatusColors: Record<string, string> = {
  LEAD: 'secondary',
  PROSPECT: 'info',
  ACTIVE: 'success',
  INACTIVE: 'warning',
  CLOSED: 'destructive',
  ARCHIVED: 'default',
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [companyId, setCompanyId] = useState('')

  const { data: companies } = trpc.company.list.useQuery()
  const { data: customers, refetch } = trpc.customer.list.useQuery({
    companyId,
    status: status || undefined,
    search: search || undefined,
  })

  const deleteMutation = trpc.customer.delete.useMutation({
    onSuccess: () => {
      toast.success('Customer deleted successfully')
      refetch()
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer relationships and locations</p>
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, GST, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="LEAD">Lead</SelectItem>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="w-[220px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select Company" />
              </SelectTrigger>
              <SelectContent>
                {companies?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers?.map((customer, i) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/customers/${customer.id}`}>
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{customer.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{customer.industry || 'No industry'}</p>
                      </div>
                    </div>
                    <Badge variant={customerStatusColors[customer.status] as any}>
                      {customer.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">GST</span>
                      <span>{customer.gst || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Locations</span>
                      <span>{customer.locations?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Assets</span>
                      <span>{customer._count?.assets || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contracts</span>
                      <span>{customer._count?.contracts || 0}</span>
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

      {customers?.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No customers found</h3>
          <p className="text-muted-foreground">Get started by adding your first customer</p>
        </div>
      )}
    </div>
  )
}
