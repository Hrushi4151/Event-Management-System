import { NextResponse } from 'next/server';
import connectDB from '../../../../utils/mongoose';
import Registration from '../../../../models/Registration';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';

export async function GET(req) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userEmail = session.user.email;

    // Find registrations where the user is a team member and has a pending invitation
    const registrations = await Registration.find({
      'teamMembers': {
        $elemMatch: {
          email: userEmail,
          invitationStatus: 'Pending'
        }
      }
    }).populate('event', 'title startDate endDate location poster').sort({ createdAt: -1 });

    // Transform data to send relevant info
    const invitations = registrations.map(reg => {
      const member = reg.teamMembers.find(m => m.email === userEmail);
      return {
        registrationId: reg._id,
        teamName: reg.teamName,
        leaderName: reg.leader.name,
        event: reg.event,
        invitationToken: member.invitationToken,
        status: member.invitationStatus,
        receivedAt: reg.createdAt // Approximate
      };
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Fetch invitations error:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}

