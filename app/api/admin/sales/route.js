import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !['superadmin', 'admin', 'staff'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let whereClause = {};

    // If role is staff, only show their own sales records
    if (session.user.role === 'staff') {
      whereClause.staffId = session.user.oid; 
      // wait, user object from session has `id` not `oid`. Let's use user id to find oid.
    }

    // Actually, `staffId` in SalesRecord references `User.oid` based on the schema mapping! 
    // Schema: staffId String @db.ObjectId, references [oid]
    // So we need the user's oid.
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (session.user.role === 'staff') {
      whereClause.staffId = user.oid;
    }

    const sales = await prisma.salesRecord.findMany({
      where: whereClause,
      include: {
        staff: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['superadmin', 'admin', 'staff'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { 
      customerName, 
      customerEmail, 
      status, 
      totalPayment, 
      remainingPayment, 
      subscriptionBasis, 
      subscriptionDuration, 
      notes 
    } = data;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newSale = await prisma.salesRecord.create({
      data: {
        staffId: user.oid,
        customerName,
        customerEmail,
        status: status || 'Lead',
        totalPayment: parseFloat(totalPayment) || 0,
        remainingPayment: parseFloat(remainingPayment) || 0,
        subscriptionBasis,
        subscriptionDuration,
        notes
      }
    });

    return NextResponse.json({ success: true, sale: newSale });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
