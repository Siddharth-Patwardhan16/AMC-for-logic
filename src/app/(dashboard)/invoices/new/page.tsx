import { CreateFormPlaceholder } from '@/components/create-form-placeholder'

export default function NewInvoicePage() {
  return (
    <CreateFormPlaceholder
      title="New Invoice"
      backHref="/invoices"
      backLabel="Back to Invoices"
    />
  )
}
