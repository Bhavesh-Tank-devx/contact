import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Contact from '@/models/Contact';
import { getUserFromRequest } from '@/lib/jwt';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userPayload = getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only superadmin can edit other users
    if (userPayload.role !== 'superadmin') {
       return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { username, email, role, profileImage } = body;
    const { id } = await params;

    await connectDB();
    
     // Validation: Check if email/username already taken by another user
    const checkOrConditions = [];
    if (email) checkOrConditions.push({ email });
    if (username) checkOrConditions.push({ username });

    if (checkOrConditions.length > 0) {
        const existingUser = await User.findOne({
            _id: { $ne: id },
            $or: checkOrConditions
        });

            if (existingUser) {
                if (email && existingUser.email === email) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
                if (username && existingUser.username === username) return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
            }
    }

    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userPayload = getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only superadmin can delete users
    if (userPayload.role !== 'superadmin') {
         return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;

    await connectDB();

    // 1. Delete all contacts created by this user
    await Contact.deleteMany({ owner: id });

    // 2. Delete the user
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
