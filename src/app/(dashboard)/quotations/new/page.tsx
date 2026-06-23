import { FinanceDocumentForm } from '@/components/finance/finance-document-form'

interface NewQuotationPageProps {
  searchParams: Promise<{ customerId?: string }>
}

export default async function NewQuotationPage({ searchParams }: NewQuotationPageProps) {
  const { customerId } = await searchParams
  return <FinanceDocumentForm mode="quotation" initialCustomerId={customerId} />
}
