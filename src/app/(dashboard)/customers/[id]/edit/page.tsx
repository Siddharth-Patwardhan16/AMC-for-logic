'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/components/providers'

const customerStatuses = ['LEAD', 'PROSPECT', 'ACTIVE', 'INACTIVE', 'CLOSED', 'ARCHIVED']

export default function CustomerEditPage() {
  const params = useParams()
  const id = String(params.id)
  const { data: customer, isLoading } = trpc.customer.get.useQuery({ id })

  if (isLoading || !customer) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#4F8CFF] border-t-transparent" />
      </div>
    )
  }

  return <CustomerEditForm customer={customer} id={id} />
}

interface CustomerEditFormProps {
  id: string
  customer: {
    name: string
    industry: string | null
    gst: string | null
    pan: string | null
    billingAddress: string | null
    shippingAddress: string | null
    status: string
    notes: string | null
    tags: string[]
  }
}

function CustomerEditForm({ customer, id }: CustomerEditFormProps) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [form, setForm] = useState({
    name: customer.name ?? '',
    industry: customer.industry ?? '',
    gst: customer.gst ?? '',
    pan: customer.pan ?? '',
    billingAddress: customer.billingAddress ?? '',
    shippingAddress: customer.shippingAddress ?? '',
    status: customer.status ?? 'ACTIVE',
    notes: customer.notes ?? '',
    tags: customer.tags?.join(', ') ?? '',
  })

  const updateCustomer = trpc.customer.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.customer.get.invalidate({ id }),
        utils.customer.list.invalidate(),
      ])
      toast.success('Customer updated')
      router.push(`/customers/${id}`)
    },
    onError: (error) => toast.error(error.message),
  })

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error('Customer name is required')
      return
    }

    updateCustomer.mutate({
      id,
      name: form.name.trim(),
      industry: form.industry || undefined,
      gst: form.gst || undefined,
      pan: form.pan || undefined,
      billingAddress: form.billingAddress || undefined,
      shippingAddress: form.shippingAddress || undefined,
      status: form.status,
      notes: form.notes || undefined,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <div className="mx-auto max-w-[900px] p-5 lg:p-8">
      <Link href={`/customers/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#A1A1AA] hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Customer
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Edit Customer</h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">Update account details, tax data, addresses, and status.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Customer details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Name</Label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Industry</Label>
              <Input value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">GST</Label>
              <Input value={form.gst} onChange={(event) => setForm((current) => ({ ...current, gst: event.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">PAN</Label>
              <Input value={form.pan} onChange={(event) => setForm((current) => ({ ...current, pan: event.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Status</Label>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="h-10 w-full rounded-xl border border-[#262626] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:border-[#4F8CFF]/30"
              >
                {customerStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Tags</Label>
              <Input
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                placeholder="AMC, priority, Nashik"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Billing address</Label>
              <Input value={form.billingAddress} onChange={(event) => setForm((current) => ({ ...current, billingAddress: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Shipping address</Label>
              <Input value={form.shippingAddress} onChange={(event) => setForm((current) => ({ ...current, shippingAddress: event.target.value }))} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
          <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Notes</Label>
          <textarea
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            rows={5}
            className="w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-3 text-sm text-white placeholder:text-[#52525B] focus:outline-none focus:border-[#4F8CFF]/30"
          />
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" className="rounded-xl" disabled={updateCustomer.isPending}>
            {updateCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
          <Button type="button" variant="ghost" className="rounded-xl" onClick={() => router.push(`/customers/${id}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
