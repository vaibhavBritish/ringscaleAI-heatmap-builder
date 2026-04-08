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

        // //console.log('--- NEXTAUTH DEBUG ---')
        // //console.log('Email tried:', credentials.email.toLowerCase())
        // //console.log('Safe user object:', user ? { id: user.id, email: user.email, role: user.role } : 'Not found')

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
          planEndsAt: user.planEndsAt || null,
          stripeCustomerId: user.stripeCustomerId || null,
          role: user.role || 'user'
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
        token.planEndsAt = user.planEndsAt
        token.stripeCustomerId = user.stripeCustomerId
        token.role = user.role
      }

      // Fetch fresh data from DB on manual update or periodically
      if (trigger === 'update') {
        const freshUser = await prisma.user.findUnique({ where: { id: token.id } })
        if (freshUser) {
          token.plan = freshUser.plan
          token.credits = freshUser.credits
          token.trialEndsAt = freshUser.trialEndsAt
          token.planEndsAt = freshUser.planEndsAt
          token.stripeCustomerId = freshUser.stripeCustomerId
          token.role = freshUser.role
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
        session.user.planEndsAt = token.planEndsAt
        session.user.stripeCustomerId = token.stripeCustomerId
        session.user.role = token.role
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
