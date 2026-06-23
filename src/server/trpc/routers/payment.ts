import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../context'

const paymentModeSchema = z.enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'ONLINE'])

function invoiceStatus(totalAmount: number, paidAmount: number, dueDate: Date) {
  if (paidAmount >= totalAmount) return 'PAID' as const
  if (paidAmount > 0) return 'PARTIAL' as const
  if (new Date() > dueDate) return 'OVERDUE' as const
  return 'SENT' as const
}

export const paymentRouter = router({
  recordForInvoice: protectedProcedure
    .input(z.object({
      invoiceId: z.string(),
      amount: z.number().positive(),
      paymentDate: z.string().optional(),
      paymentMode: paymentModeSchema.default('BANK_TRANSFER'),
      reference: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id: input.invoiceId },
          select: {
            id: true,
            customerId: true,
            totalAmount: true,
            paidAmount: true,
            dueDate: true,
            status: true,
          },
        })

        if (!invoice) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' })
        }

        if (invoice.status === 'CANCELLED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Payments cannot be recorded against a cancelled invoice',
          })
        }

        const total = Number(invoice.totalAmount)
        const existingPaid = Number(invoice.paidAmount)
        const remaining = Math.max(0, total - existingPaid)

        if (input.amount > remaining + 0.01) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Payment exceeds outstanding amount of Rs. ${remaining.toLocaleString('en-IN')}`,
          })
        }

        const payment = await tx.payment.create({
          data: {
            amount: input.amount,
            paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
            paymentMode: input.paymentMode,
            reference: input.reference,
            notes: input.notes,
            customerId: invoice.customerId,
            invoiceId: invoice.id,
          },
        })

        const paidAmount = existingPaid + input.amount

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount,
            status: invoiceStatus(total, paidAmount, invoice.dueDate),
          },
        })

        return payment
      })
    }),
})
