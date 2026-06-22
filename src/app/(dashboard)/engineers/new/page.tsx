import { CreateFormPlaceholder } from '@/components/create-form-placeholder'

export default function NewEngineerPage() {
  return (
    <CreateFormPlaceholder
      title="New Engineer"
      backHref="/engineers"
      backLabel="Back to Engineers"
    />
  )
}
