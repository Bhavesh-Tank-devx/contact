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

    if (userPayload.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'You are not allowed to view this page.' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalContacts = await Contact.countDocuments();

    // Get users with their contact counts
    // We can use aggregation to join contacts and count them
    const userAnalytics = await User.aggregate([
      {
        $lookup: {
          from: 'contacts',
          localField: '_id',
          foreignField: 'owner',
          as: 'userContacts'
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          contactCount: { $size: '$userContacts' }
        }
      },
      {
        $sort: { contactCount: -1 } // Sort by most active users
      }
    ]);

    return NextResponse.json({
      data: {
        totalUsers,
        totalContacts,
        userAnalytics
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
