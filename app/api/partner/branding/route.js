import { NextResponse } from 'next/server' // forced update
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'


export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const company = await prisma.company.findUnique({
      where: { oid: session.user.companyId }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Branding GET Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, branding } = body

    // Simple hex validation
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (branding?.colors?.primary && !hexRegex.test(branding.colors.primary)) {
      return NextResponse.json({ error: 'Invalid primary color hex code' }, { status: 400 })
    }
    if (branding?.colors?.accent && !hexRegex.test(branding.colors.accent)) {
      return NextResponse.json({ error: 'Invalid accent color hex code' }, { status: 400 })
    }

    // Update company branding
    const updatedCompany = await prisma.company.update({
      where: { oid: session.user.companyId },
      data: {
        name,
        logo: branding?.logo || undefined,
        branding: branding // branding is a Json field
      }
    })

    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error('Branding POST Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
