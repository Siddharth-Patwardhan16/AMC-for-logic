import { CreateFormPlaceholder } from '@/components/create-form-placeholder'

export default function NewTicketPage() {
  return (
    <CreateFormPlaceholder
      title="New Ticket"
      backHref="/tickets"
      backLabel="Back to Tickets"
    />
  )
}
