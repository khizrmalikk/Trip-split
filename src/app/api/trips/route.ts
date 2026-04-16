import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/trips - List all trips
export async function GET() {
  try {
    const trips = await prisma.trip.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            expenses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ trips });
  } catch (error) {
    console.error('Failed to fetch trips:', error);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, startDate, endDate, currency, creatorName, creatorEmail } = body;
    
    // Create user if doesn't exist
    let user = creatorEmail
      ? await prisma.user.findUnique({ where: { email: creatorEmail } })
      : null;
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: creatorName,
          email: creatorEmail || null,
        },
      });
    }
    
    // Create trip
    const trip = await prisma.trip.create({
      data: {
        name,
        description: description || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        currency: currency || 'USD',
        members: {
          create: {
            userId: user.id,
            role: 'admin',
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
    
    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error('Failed to create trip:', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
