import { NextRequest } from 'next/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/trpc/router'
import { createContext } from '@/server/trpc/context'

/** Allow long-running AMC spreadsheet imports on serverless (Netlify Pro max ~26s). */
export const maxDuration = 60

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
  })

export { handler as GET, handler as POST }
