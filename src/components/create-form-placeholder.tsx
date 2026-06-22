import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function CreateFormPlaceholder({
  title,
  description = 'Create form coming in the next release.',
  backHref,
  backLabel = 'Back',
}: {
  title: string
  description?: string
  backHref: string
  backLabel?: string
}) {
  return (
    <div className="p-5 lg:p-8 max-w-[640px] mx-auto">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-[#A1A1AA] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      <div className="p-8 rounded-2xl bg-[#111111] border border-[#262626] text-center">
        <h1 className="text-xl font-bold text-white mb-2">{title}</h1>
        <p className="text-sm text-[#A1A1AA]">{description}</p>
      </div>
    </div>
  )
}
