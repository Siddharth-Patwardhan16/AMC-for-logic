export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Coming soon - comprehensive analytics and reporting</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          'Revenue Report',
          'AMC Performance',
          'Customer Analysis',
          'Engineer Utilization',
          'Asset Lifecycle',
          'Ticket Metrics',
        ].map((report) => (
          <div key={report} className="p-6 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
            <h3 className="font-medium">{report}</h3>
            <p className="text-sm text-muted-foreground mt-1">Available in Phase 2</p>
          </div>
        ))}
      </div>
    </div>
  )
}
