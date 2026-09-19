import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['superadmin', 'admin', 'staff'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
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
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const sale = await prisma.salesRecord.findUnique({ where: { id } });
    if (!sale) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    if (session.user.role === 'staff' && sale.staffId !== user.oid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedSale = await prisma.salesRecord.update({
      where: { id },
      data: {
        customerName,
        customerEmail,
        status,
        totalPayment: parseFloat(totalPayment) || 0,
        remainingPayment: parseFloat(remainingPayment) || 0,
        subscriptionBasis,
        subscriptionDuration,
        notes
      }
    });

    return NextResponse.json({ success: true, sale: updatedSale });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['superadmin', 'admin', 'staff'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const sale = await prisma.salesRecord.findUnique({ where: { id } });
    if (!sale) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    if (session.user.role === 'staff' && sale.staffId !== user.oid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.salesRecord.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
