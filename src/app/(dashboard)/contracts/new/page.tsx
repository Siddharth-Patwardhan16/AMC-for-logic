import { CreateFormPlaceholder } from '@/components/create-form-placeholder'

export default function NewContractPage() {
  return (
    <CreateFormPlaceholder
      title="New Contract"
      backHref="/contracts"
      backLabel="Back to Contracts"
    />
  )
}
