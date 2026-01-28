import { NextResponse } from 'next/server';
import connectDB from '../../../../utils/mongoose';
import Registration from '../../../../models/Registration';
import Event from '../../../../models/Event'; // Ensure Event model is loaded

export async function POST(req) {
  await connectDB();
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find registration containing the member with this token
    // We use elemMatch to find the document
    const registration = await Registration.findOne({
      'teamMembers.invitationToken': token
    }).populate('event', 'title');

    if (!registration) {
      return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 404 });
    }

    // Find the specific member index
    const memberIndex = registration.teamMembers.findIndex(m => m.invitationToken === token);
    if (memberIndex === -1) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const member = registration.teamMembers[memberIndex];

    if (member.invitationStatus === 'Accepted') {
      return NextResponse.json({ 
        message: 'You have already accepted this invitation.',
        eventTitle: registration.event.title,
        teamName: registration.teamName
      }, { status: 200 });
    }

    // Update status
    member.invitationStatus = 'Accepted';
    // member.invitationToken = undefined; // Optional: Clear token to prevent re-use? Or keep for record? Keeping for now.
    
    // Check if ALL members have accepted
    const allAccepted = registration.teamMembers.every(m => m.invitationStatus === 'Accepted');
    
    // If all accepted, update main status from 'Awaiting Members' to 'Pending'
    if (allAccepted && registration.status === 'Awaiting Members') {
      registration.status = 'Pending';
    }

    // Since we modified a subdocument array element, we need to mark it modified or just save parent
    // Mongoose handles array updates if we modify the object retrieved from the document
    // But since we accessed via index, we might need to be careful.
    // Actually: registration.teamMembers[memberIndex] is a reference to the Mongoose object in the array.
    
    await registration.save();

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully!',
      eventTitle: registration.event?.title || 'Event',
      teamName: registration.teamName || 'Team'
    });

  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Failed to process invitation' }, { status: 500 });
  }
}
