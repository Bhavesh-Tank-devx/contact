import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contact from '@/models/Contact';
import { getUserFromRequest } from '@/lib/jwt';

// GET /api/contacts/[id] - Get one contact
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

    await connectDB();

    const { id } = await params;

    const contact = await Contact.findOne({
      _id: id,
      owner: userPayload.userId,
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: contact });
  } catch (error) {
    console.error('Get contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Update contact
export async function PUT(
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

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, age, profileImage } = body;

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (age !== undefined) updateData.age = age;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    // Query object - if superadmin, find by ID only. If member, find by ID and owner.
    const query = userPayload.role === 'superadmin' 
        ? { _id: id }
        : { _id: id, owner: userPayload.userId };

    const contact = await Contact.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: contact });
  } catch (error) {
    console.error('Update contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Delete contact
export async function DELETE(
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

    await connectDB();

    const { id } = await params;

    // Query object - if superadmin, find by ID only. If member, find by ID and owner.
    const query = userPayload.role === 'superadmin' 
        ? { _id: id }
        : { _id: id, owner: userPayload.userId };

    const contact = await Contact.findOneAndDelete(query);

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: contact });
  } catch (error) {
    console.error('Delete contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
