import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contact from '@/models/Contact';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/jwt';

// GET /api/contacts - List contacts for logged-in user
export async function GET(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const contacts = await Contact.find({ owner: userPayload.userId }).sort({ createdAt: -1 });

    return NextResponse.json({ data: contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create contact for logged-in user
export async function POST(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Verify user exists (in case they were deleted by admin while logged in)
    const userExists = await User.findById(userPayload.userId);
    if (!userExists) {
      return NextResponse.json(
        { error: 'User account no longer exists' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, phone, age, profileImage } = body;

    // Validate required fields (only name and phone are required)
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Create contact with owner automatically set from JWT
    const contact = await Contact.create({
      name,
      email: email || undefined,
      phone,
      age: age || undefined,
      profileImage: profileImage || undefined,
      owner: userPayload.userId,
    });

    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
