'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { UserPlus, Users, Pencil, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/ui/fade-in'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers'
import { toast } from 'sonner'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const roles = ['ADMIN', 'MANAGER', 'ENGINEER', 'ACCOUNTS', 'VIEWER'] as const
const statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const

type UserForm = {
  name: string
  email: string
  password: string
  role: (typeof roles)[number]
  phone: string
  status: (typeof statuses)[number]
}

const emptyForm: UserForm = {
  name: '',
  email: '',
  password: '',
  role: 'ENGINEER',
  phone: '',
  status: 'ACTIVE',
}

export function TeamMembersPanel() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)

  const { data, refetch } = trpc.engineer.list.useQuery({
    search: debouncedSearch || undefined,
    pageSize: 50,
  })

  const create = trpc.engineer.create.useMutation({
    onSuccess: () => {
      toast.success('Team member created')
      refetch()
      setEditing(null)
      setForm(emptyForm)
    },
    onError: (error) => toast.error(error.message),
  })

  const update = trpc.engineer.update.useMutation({
    onSuccess: () => {
      toast.success('Team member updated')
      refetch()
      setEditing(null)
    },
    onError: (error) => toast.error(error.message),
  })

  const del = trpc.engineer.delete.useMutation({
    onSuccess: () => {
      toast.success('Team member removed')
      refetch()
    },
    onError: (error) => toast.error(error.message),
  })

  const users = data?.items ?? []

  const startCreate = () => {
    setEditing('new')
    setForm(emptyForm)
  }

  const startEdit = (user: any) => {
    setEditing(user.id)
    setForm({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      status: user.status,
    })
  }

  const save = () => {
    if (editing === 'new') {
      if (!form.password || form.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      create.mutate({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
      })
      return
    }

    if (editing) {
      update.mutate({
        id: editing,
        name: form.name,
        email: form.email,
        role: form.role,
        status: form.status,
        phone: form.phone || undefined,
      })
    }
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-[#262626] bg-[#111111] p-6 text-center">
        <Users className="h-8 w-8 text-[#52525B] mx-auto mb-3" />
        <p className="text-sm text-[#A1A1AA]">Only administrators can manage team members.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Team Members</h2>
          <p className="text-sm text-[#A1A1AA] mt-0.5">Create employee logins and track who creates records</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-sm font-medium transition-all"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="relative mb-4">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {users.map((user: any, i: number) => (
          <FadeIn key={user.id} staggerIndex={i % 6} className="p-4 rounded-2xl bg-[#111111] border border-[#262626]">
            {editing === user.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserForm['role'] })}
                    className="h-10 rounded-xl border border-[#262626] bg-[#0A0A0A] px-3 text-sm text-white"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as UserForm['status'] })}
                    className="h-10 rounded-xl border border-[#262626] bg-[#0A0A0A] px-3 text-sm text-white"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-xs text-[#A1A1AA] hover:text-white">Cancel</button>
                  <button onClick={save} className="px-3 py-1.5 rounded-lg bg-[#22C55E] text-white text-xs font-medium">Save</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-[#A855F7]/10 flex items-center justify-center text-[#A855F7] font-bold shrink-0">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{user.name || user.email}</p>
                      <Badge variant={user.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">{user.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{user.role}</Badge>
                    </div>
                    <p className="text-xs text-[#52525B] truncate">{user.email}</p>
                    {user.lastLoginAt && (
                      <p className="text-[11px] text-[#52525B] mt-0.5">
                        Last login {new Date(user.lastLoginAt).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => startEdit(user)} className="p-2 rounded-lg hover:bg-[#171717] text-[#A1A1AA] hover:text-white">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {user.id !== session?.user?.id && (
                    <button onClick={() => del.mutate({ id: user.id })} className="p-2 rounded-lg hover:bg-[#171717] text-[#A1A1AA] hover:text-[#EF4444]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </FadeIn>
        ))}
      </div>

      {editing === 'new' && (
        <FadeIn className="mt-3 p-4 rounded-2xl bg-[#111111] border border-[#262626]">
          <p className="text-sm font-medium text-white mb-3">New Team Member</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Password *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserForm['role'] })}
              className="h-10 rounded-xl border border-[#262626] bg-[#0A0A0A] px-3 text-sm text-white"
            >
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-xs text-[#A1A1AA] hover:text-white">Cancel</button>
            <button onClick={save} className="px-3 py-1.5 rounded-lg bg-[#22C55E] text-white text-xs font-medium">Create User</button>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
