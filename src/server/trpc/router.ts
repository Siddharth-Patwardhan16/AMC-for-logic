import { router } from './context'
import { companyRouter } from './routers/company'
import { customerRouter } from './routers/customer'
import { assetRouter } from './routers/asset'
import { contractRouter } from './routers/contract'
import { invoiceRouter } from './routers/invoice'
import { quotationRouter } from './routers/quotation'
import { ticketRouter } from './routers/ticket'
import { engineerRouter } from './routers/engineer'
import { implementationRouter } from './routers/implementation'
import { documentRouter } from './routers/document'
import { dashboardRouter } from './routers/dashboard'
import { crmRouter } from './routers/crm'
import { materialRouter } from './routers/material'
import { amcScheduleRouter } from './routers/amc-schedule'

export const appRouter = router({
  company: companyRouter,
  customer: customerRouter,
  asset: assetRouter,
  contract: contractRouter,
  invoice: invoiceRouter,
  quotation: quotationRouter,
  ticket: ticketRouter,
  engineer: engineerRouter,
  implementation: implementationRouter,
  document: documentRouter,
  dashboard: dashboardRouter,
  crm: crmRouter,
  material: materialRouter,
  amcSchedule: amcScheduleRouter,
})

export type AppRouter = typeof appRouter
