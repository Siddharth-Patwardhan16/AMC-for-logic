'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, Receipt, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/components/providers'

const invoiceTypeLabels: Record<string, string> = {
  TAX_INVOICE: 'Tax Invoice',
  PROFORMA_INVOICE: 'Proforma Invoice',
  AMC_INVOICE: 'AMC Invoice',
  PROJECT_INVOICE: 'Project Invoice',
}

const invoiceStatusColors: Record<string, string> = {
  DRAFT: 'secondary',
  SENT: 'info',
  PARTIAL: 'warning',
  PAID: 'success',
  OVERDUE: 'destructive',
  CANCELLED: 'default',
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [invoiceType, setInvoiceType] = useState('')
  const [status, setStatus] = useState('')

  const { data: invoices } = trpc.invoice.list.useQuery({
    invoiceType: invoiceType || undefined,
    status: status || undefined,
    search: search || undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage billing and track payments</p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={invoiceType} onValueChange={setInvoiceType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {Object.keys(invoiceTypeLabels).map((type) => (
                  <SelectItem key={type} value={type}>{invoiceTypeLabels[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {invoices?.map((invoice, i) => (
          <motion.div
            key={invoice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/invoices/${invoice.id}`}>
              <Card className="card-hover cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground">{invoice.customer?.name}</p>
                      </div>
                    </div>
                    <Badge variant={invoiceStatusColors[invoice.status] as any}>
                      {invoice.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span>{invoiceTypeLabels[invoice.invoiceType]}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">₹{Number(invoice.totalAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Paid</span>
                      <span>₹{Number(invoice.paidAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Due Date</span>
                      <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
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

      {invoices?.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No invoices found</h3>
          <p className="text-muted-foreground">Create your first invoice</p>
        </div>
      )}
    </div>
  )
}
