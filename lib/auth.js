import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter email and password')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        })

        if (!user) {
          throw new Error('No user found with this email')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan || 'trial',
          credits: user.credits || 0,
          trialEndsAt: user.trialEndsAt || null,
          stripeCustomerId: user.stripeCustomerId || null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.plan = user.plan
        token.credits = user.credits
        token.trialEndsAt = user.trialEndsAt
        token.stripeCustomerId = user.stripeCustomerId
      }

      // Fetch fresh data from DB on manual update or periodically
      if (trigger === 'update') {
        const freshUser = await prisma.user.findUnique({ where: { id: token.id } })
        if (freshUser) {
          token.plan = freshUser.plan
          token.credits = freshUser.credits
          token.trialEndsAt = freshUser.trialEndsAt
          token.stripeCustomerId = freshUser.stripeCustomerId
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.plan = token.plan
        session.user.credits = token.credits
        session.user.trialEndsAt = token.trialEndsAt
        session.user.stripeCustomerId = token.stripeCustomerId
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET
}
