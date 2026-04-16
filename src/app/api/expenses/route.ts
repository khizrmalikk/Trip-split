import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tripId,
      paidById,
      amount,
      currency,
      description,
      category,
      splitType,
      splitWith, // array of userId for custom split
    } = body;
    
    // Get trip to determine members
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });
    
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    
    // Determine who shares this expense
    let participants: string[] = [];
    if (splitType === 'equal') {
      participants = trip.members.map(m => m.userId);
    } else if (splitType === 'custom' && splitWith) {
      participants = splitWith;
    } else if (splitType === 'pair' && splitWith && splitWith.length === 1) {
      participants = [paidById, splitWith[0]];
    }
    
    // Calculate split amount
    const splitAmount = Number((amount / participants.length).toFixed(2));
    
    // Create expense with splits
    const expense = await prisma.expense.create({
      data: {
        tripId,
        paidById,
        amount,
        currency: currency || 'USD',
        description,
        category: category || null,
        splitType,
        splits: {
          create: participants.map(userId => ({
            userId,
            amount: splitAmount,
          })),
        },
      },
      include: {
        paidBy: true,
        splits: true,
      },
    });
    
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('Failed to create expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
