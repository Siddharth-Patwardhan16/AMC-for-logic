import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
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
            where: { email: credentials.email },
          })
          if (!user) return null

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
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
