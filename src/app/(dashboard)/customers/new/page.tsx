import { CreateFormPlaceholder } from '@/components/create-form-placeholder'

export default function NewCustomerPage() {
  return (
    <CreateFormPlaceholder
      title="New Customer"
      backHref="/customers"
      backLabel="Back to Customers"
    />
  )
}
