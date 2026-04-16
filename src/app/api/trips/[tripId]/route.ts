import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSettlements } from '@/lib/settlement';

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// GET /api/trips/[tripId] - Get trip details with balances
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { tripId } = await context.params;
    
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        expenses: {
          include: {
            paidBy: true,
            splits: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });
    
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    
    // Calculate balances for each member
    const balances = trip.members.map(member => {
      const paid = trip.expenses
        .filter(e => e.paidById === member.userId)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const owes = trip.expenses
        .flatMap(e => e.splits)
        .filter(s => s.userId === member.userId)
        .reduce((sum, s) => sum + s.amount, 0);
      
      return {
        userId: member.userId,
        userName: member.user.name,
        net: Number((paid - owes).toFixed(2)),
      };
    });
    
    // Calculate settlements
    const settlements = calculateSettlements(balances);
    
    return NextResponse.json({
      trip,
      balances,
      settlements,
    });
  } catch (error) {
    console.error('Failed to fetch trip:', error);
    return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 });
  }
}
