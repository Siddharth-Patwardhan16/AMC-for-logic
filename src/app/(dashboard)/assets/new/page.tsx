import { CreateFormPlaceholder } from '@/components/create-form-placeholder'

export default function NewAssetPage() {
  return (
    <CreateFormPlaceholder
      title="New Asset"
      backHref="/assets"
      backLabel="Back to Assets"
    />
  )
}
