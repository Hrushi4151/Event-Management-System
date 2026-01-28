// app/api/registration/user/[userId]/route.js
import connectDB from '../../../../../utils/mongoose';
import Registration from '../../../../../models/Registration';
import { NextResponse } from 'next/server';

// GET - Fetch registrations for a specific user
// GET - Fetch registrations for a specific user (Leader or Accepted Team Member)
import User from '../../../../../models/User';

export async function GET(req, { params }) {
  await connectDB();
  try {
    const { userId } = await params;
    
    // 1. Get user details for email
    const user = await User.findById(userId);
    if (!user) {
         return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userEmail = user.email;

    // 2. Find where:
    // - User is Leader
    // - OR User is Team Member AND Invitation is Accepted
    const registrations = await Registration.find({
        $or: [
            { 'leader.userId': userId },
            { 
               'teamMembers': { 
                  $elemMatch: { 
                      email: userEmail, 
                      invitationStatus: 'Accepted' 
                  } 
               } 
            }
        ]
    })
      .populate('event', 'title startDate endDate location mode')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(registrations);
  } catch (error) {
    console.log('Fetch user registrations error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user registrations' 
    }, { status: 500 });
  }
}