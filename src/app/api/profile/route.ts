import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Contact from '@/models/Contact';
import { getUserFromRequest } from '@/lib/jwt';

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

    const user = await User.findById(userPayload.userId).select('-password');
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
    try {
        const userPayload = getUserFromRequest(request);
        if (!userPayload) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log("Update profile request body:", body);
        const { username, email, profileImage } = body;

        await connectDB();
        
        // Validation: Check if email/username already taken by another user
        // Build the OR query only if username or email is provided
        const checkOrConditions = [];
        if (email) checkOrConditions.push({ email });
        if (username) checkOrConditions.push({ username });

        if (checkOrConditions.length > 0) {
            const existingUser = await User.findOne({
                _id: { $ne: userPayload.userId },
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
        if (profileImage !== undefined) updateData.profileImage = profileImage;

        const user = await User.findByIdAndUpdate(
            userPayload.userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        return NextResponse.json({ data: user });

    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const userPayload = getUserFromRequest(request);
        if (!userPayload) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // 1. Delete all contacts created by this user
        await Contact.deleteMany({ owner: userPayload.userId });

        // 2. Delete the user
        const deletedUser = await User.findByIdAndDelete(userPayload.userId);

        if (!deletedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User account and associated contacts deleted successfully' });

    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
