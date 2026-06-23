import { FinanceDocumentForm } from '@/components/finance/finance-document-form'

interface NewInvoicePageProps {
  searchParams: Promise<{ customerId?: string }>
}

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const { customerId } = await searchParams
  return <FinanceDocumentForm mode="invoice" initialCustomerId={customerId} />
}
