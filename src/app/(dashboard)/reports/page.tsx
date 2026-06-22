export default function ReportsPage() {
  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Reports</h1>
        <p className="text-sm text-[#A1A1AA] mt-1">Analytics & insights</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          'Revenue Report',
          'AMC Performance',
          'Customer Analysis',
          'Engineer Utilization',
          'Asset Lifecycle',
          'Ticket Metrics',
        ].map((report) => (
          <div key={report} className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all cursor-pointer">
            <h3 className="text-sm font-medium text-white">{report}</h3>
            <p className="text-xs text-[#52525B] mt-1">Available in Phase 2</p>
          </div>
        ))}
      </div>
    </div>
  )
}
