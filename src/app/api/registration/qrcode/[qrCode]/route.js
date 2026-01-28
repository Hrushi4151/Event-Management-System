// app/api/registration/qrcode/[qrCode]/route.js
import connectDB from '../../../../../utils/mongoose';
import Registration from '../../../../../models/Registration';
import { NextResponse } from 'next/server';

// GET - Find registration by QR code (leader or team member)
export async function GET(req, { params }) {
  await connectDB();
  try {
    const { qrCode } = await params;
    
    // First, try to find by leader QR code
    let registration = await Registration.findOne({ qrCode })
      .populate('event', 'title startDate endDate location')
      .populate('leader.userId', 'name email');
    
    let memberInfo = null;
    let isLeader = true;
    
    // If not found, search in team members
    if (!registration) {
      registration = await Registration.findOne({
        'teamMembers.qrCode': qrCode
      })
        .populate('event', 'title startDate endDate location')
        .populate('leader.userId', 'name email');
      
      if (registration) {
        // Find which team member this QR code belongs to
        const member = registration.teamMembers.find(m => m.qrCode === qrCode);
        if (member) {
          memberInfo = member;
          isLeader = false;
        }
      }
    }
    
    if (!registration) {
      return NextResponse.json({ 
        error: 'Registration not found' 
      }, { status: 404 });
    }
    
    // Validate event date - only allow scanning during event period
    const now = new Date();
    const eventStartDate = new Date(registration.event.startDate);
    const eventEndDate = new Date(registration.event.endDate);
    
    // Set time to start of day for start date and end of day for end date
    eventStartDate.setHours(0, 0, 0, 0);
    eventEndDate.setHours(23, 59, 59, 999);
    
    if (now < eventStartDate) {
      return NextResponse.json({ 
        error: `Ticket scanning is not yet available. Event starts on ${registration.event.startDate}` 
      }, { status: 403 });
    }
    
    if (now > eventEndDate) {
      return NextResponse.json({ 
        error: `Ticket scanning has ended. Event ended on ${registration.event.endDate}` 
      }, { status: 403 });
    }
    
    // Return registration with member info
    return NextResponse.json({
      ...registration.toObject(),
      scannedMember: memberInfo,
      isLeader,
    });
  } catch (error) {
    console.log('Find registration by QR code error:', error);
    return NextResponse.json({ 
      error: 'Failed to find registration' 
    }, { status: 500 });
  }
}
