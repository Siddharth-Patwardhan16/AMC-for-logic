import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-white mb-2">404</p>
        <h1 className="text-xl font-semibold text-white mb-2">Page not found</h1>
        <p className="text-sm text-[#A1A1AA] mb-8">
          This page does not exist or may have moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-[#4F8CFF] text-white text-sm font-medium hover:bg-[#4F8CFF]/90 transition-colors"
          >
            Go to Overview
          </Link>
          <Link
            href="/login"
            className="px-4 py-2.5 rounded-xl bg-[#111111] border border-[#262626] text-[#A1A1AA] text-sm hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
