'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Megaphone, Phone, Mail, Calendar, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/components/providers'
import { toast } from 'sonner'

const activityTypeIcons: Record<string, any> = {
  CALL: Phone,
  MEETING: Calendar,
  EMAIL: Mail,
  QUOTATION: Megaphone,
  NEGOTIATION: Megaphone,
  FOLLOW_UP: Phone,
  NOTE: Megaphone,
}

const statusColors: Record<string, string> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
}

export default function CRMPage() {
  const [search, setSearch] = useState('')
  const [activityType, setActivityType] = useState('')
  const [status, setStatus] = useState('')

  const { data: activities, refetch } = trpc.crm.listActivities.useQuery({
    activityType: activityType || undefined,
    status: status || undefined,
  })

  const { data: pipeline } = trpc.crm.pipeline.useQuery()

  const updateMutation = trpc.crm.updateActivity.useMutation({
    onSuccess: () => {
      toast.success('Activity updated')
      refetch()
    },
  })

  const filtered = activities?.filter(a =>
    a.subject.toLowerCase().includes(search.toLowerCase()) ||
    a.customer?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground mt-1">Track leads, activities, and customer pipeline</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Leads', value: pipeline?.leads || 0, color: 'bg-blue-400/10 text-blue-400' },
          { label: 'Prospects', value: pipeline?.prospects || 0, color: 'bg-purple-400/10 text-purple-400' },
          { label: 'Active', value: pipeline?.active || 0, color: 'bg-green-400/10 text-green-400' },
          { label: 'Closed', value: pipeline?.closed || 0, color: 'bg-gray-400/10 text-gray-400' },
        ].map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="CALL">Call</SelectItem>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="QUOTATION">Quotation</SelectItem>
                <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                <SelectItem value="NOTE">Note</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <div className="space-y-3">
        {filtered?.map((activity, i) => {
          const Icon = activityTypeIcons[activity.activityType] || Megaphone
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{activity.subject}</p>
                        <Badge variant={statusColors[activity.status] as any} className="text-xs">
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.customer?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.scheduledAt ? new Date(activity.scheduledAt).toLocaleString() : 'No schedule'}
                      </p>
                    </div>
                    {activity.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMutation.mutate({
                          id: activity.id,
                          status: 'COMPLETED',
                          completedAt: new Date().toISOString(),
                        })}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filtered?.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No activities found</h3>
          <p className="text-muted-foreground">Add your first CRM activity</p>
        </div>
      )}
    </div>
  )
}
