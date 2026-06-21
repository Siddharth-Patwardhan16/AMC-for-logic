'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  Briefcase, 
  FileText, 
  Ticket, 
  AlertTriangle,
  DollarSign,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  const { data: stats } = trpc.dashboard.stats.useQuery()
  const { data: revenueData } = trpc.dashboard.revenueChart.useQuery()
  const { data: recentActivity } = trpc.dashboard.recentActivity.useQuery()

  const statCards = [
    { title: 'Total Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Active Assets', value: stats?.totalAssets || 0, icon: Briefcase, color: 'text-green-400', bg: 'bg-green-400/10' },
    { title: 'Open Tickets', value: stats?.openTickets || 0, icon: Ticket, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { title: 'Pending Invoices', value: stats?.pendingInvoices || 0, icon: FileText, color: 'text-red-400', bg: 'bg-red-400/10' },
    { title: 'Active Contracts', value: stats?.activeContracts || 0, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { title: 'Total Revenue', value: `₹${Number(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your AMC business operations</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {statCards.map((card) => (
          <motion.div key={card.title} variants={item}>
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`${card.bg} p-2 rounded-lg`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={item} initial="hidden" animate="show">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--color-muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--color-muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--color-card))', 
                        border: '1px solid hsl(var(--color-border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--color-primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Expiring Contracts
              </CardTitle>
              <CardDescription>Contracts expiring in the next 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.expiringContracts?.map((contract: any) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{contract.contractNumber}</p>
                      <p className="text-xs text-muted-foreground">{contract.customer?.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="warning" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(contract.endDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-8">No expiring contracts</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="font-medium mb-3 text-sm">Recent Tickets</h3>
                <div className="space-y-2">
                  {recentActivity?.tickets?.slice(0, 5).map((ticket: any) => (
                    <div key={ticket.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50">
                      <span className="truncate">{ticket.title}</span>
                      <Badge variant={ticket.priority === 'CRITICAL' ? 'destructive' : 'secondary'} className="text-xs">
                        {ticket.status}
                      </Badge>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No recent tickets</p>}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-3 text-sm">Recent Invoices</h3>
                <div className="space-y-2">
                  {recentActivity?.invoices?.slice(0, 5).map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50">
                      <span>{invoice.invoiceNumber}</span>
                      <span className="text-muted-foreground">₹{Number(invoice.totalAmount).toLocaleString()}</span>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No recent invoices</p>}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-3 text-sm">New Customers</h3>
                <div className="space-y-2">
                  {recentActivity?.customers?.slice(0, 5).map((customer: any) => (
                    <div key={customer.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50">
                      <span>{customer.name}</span>
                      <Badge variant="outline" className="text-xs">{customer.status}</Badge>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No new customers</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
