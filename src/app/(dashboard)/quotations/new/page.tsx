import { CreateFormPlaceholder } from '@/components/create-form-placeholder'

export default function NewQuotationPage() {
  return (
    <CreateFormPlaceholder
      title="New Quotation"
      backHref="/quotations"
      backLabel="Back to Quotations"
    />
  )
}
