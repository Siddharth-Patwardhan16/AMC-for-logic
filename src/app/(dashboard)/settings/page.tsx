'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Building2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { trpc } from '@/components/providers'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [search, setSearch] = useState('')
  const [editingCompany, setEditingCompany] = useState<any>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    invoicePrefix: 'INV',
    quotationPrefix: 'QOT',
  })

  const { data: companies, refetch } = trpc.company.list.useQuery()
  const createMutation = trpc.company.create.useMutation({
    onSuccess: () => {
      toast.success('Company created successfully')
      setIsCreateOpen(false)
      refetch()
      resetForm()
    },
    onError: (err) => toast.error(err.message),
  })
  const updateMutation = trpc.company.update.useMutation({
    onSuccess: () => {
      toast.success('Company updated successfully')
      setEditingCompany(null)
      refetch()
    },
    onError: (err) => toast.error(err.message),
  })
  const deleteMutation = trpc.company.delete.useMutation({
    onSuccess: () => {
      toast.success('Company deleted')
      refetch()
    },
    onError: (err) => toast.error(err.message),
  })

  const resetForm = () => {
    setFormData({
      name: '',
      gstin: '',
      pan: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      bankName: '',
      bankAccount: '',
      bankIfsc: '',
      invoicePrefix: 'INV',
      quotationPrefix: 'QOT',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const startEdit = (company: any) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      gstin: company.gstin || '',
      pan: company.pan || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      pincode: company.pincode || '',
      bankName: company.bankName || '',
      bankAccount: company.bankAccount || '',
      bankIfsc: company.bankIfsc || '',
      invoicePrefix: company.invoicePrefix,
      quotationPrefix: company.quotationPrefix,
    })
  }

  const filteredCompanies = companies?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.gstin?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage companies, users, and system configuration</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-3">
            {filteredCompanies?.map((company) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">{company.gstin || 'No GSTIN'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={company.isActive ? 'success' : 'secondary'}>
                    {company.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(company)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: company.id })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingCompany} onOpenChange={(open) => {
        if (!open) { setIsCreateOpen(false); setEditingCompany(null); }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Edit Company' : 'Add Company'}</DialogTitle>
            <DialogDescription>
              Configure company details for billing and document generation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-medium">GSTIN</label>
                <Input value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">PAN</label>
                <Input value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">City</label>
                <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Pincode</label>
                <Input value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Bank Name</label>
                <Input value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Account Number</label>
                <Input value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">IFSC Code</label>
                <Input value={formData.bankIfsc} onChange={e => setFormData({...formData, bankIfsc: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Invoice Prefix</label>
                <Input value={formData.invoicePrefix} onChange={e => setFormData({...formData, invoicePrefix: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Quotation Prefix</label>
                <Input value={formData.quotationPrefix} onChange={e => setFormData({...formData, quotationPrefix: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditingCompany(null); }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCompany ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
