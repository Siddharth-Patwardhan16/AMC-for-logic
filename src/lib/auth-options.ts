import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: authSecret,
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const { prisma } = await import('@/lib/prisma')
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.trim().toLowerCase() },
          })
          if (!user || user.status !== 'ACTIVE') return null

          const valid = await bcrypt.compare(credentials.password, user.password)
          if (!valid) return null

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          return { id: user.id, email: user.email, name: user.name, role: user.role }
        } catch (error) {
          console.error('Credentials authorize error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub
        session.user.email = token.email as string
        session.user.name = token.name as string | null | undefined
        session.user.role = token.role as string
      }
      return session
    },
  },
}
