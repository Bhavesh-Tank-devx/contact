import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contact from '@/models/Contact';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only superadmin can access this route
    if (userPayload.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Forbidden: Superadmin access required' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await params;

    const contacts = await Contact.find({ owner: id }).sort({ createdAt: -1 });

    return NextResponse.json({ data: contacts });
  } catch (error) {
    console.error('Get user contacts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
