// app/api/registration/route.js
import connectDB from '../../../utils/mongoose';
import Registration from '../../../models/Registration';
import { NextResponse } from 'next/server';

// GET - Fetch all registrations (for organizers)
export async function GET(req) {
  await connectDB();
  try {
    const registrations = await Registration.find({})
      .populate('event', 'title startDate endDate')
      .populate('leader.userId', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(registrations);
  } catch (error) {
    console.log('Fetch registrations error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch registrations' 
    }, { status: 500 });
  }
}

// POST - Register for an event
import notificationapi from 'notificationapi-node-server-sdk';
import crypto from 'crypto';

notificationapi.init(
  'lguera0ob9w63bchw5ey0d7ywu', // App ID
  'u623uf4bwqpi6t98ellu260bu802rayskjdbo0gm34y43qu1kfzcxmtakz' // Secret
);

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    console.log('Registration data:', body);
    
    const { event, leader, teamName, teamMembers } = body;

    // Validate required fields
    if (!event || !leader || !leader.userId || !leader.name || !leader.email) {
      return NextResponse.json({ 
        error: 'Event, leader information are required' 
      }, { status: 400 });
    }

    // Fetch event to check registration window
    const Event = (await import('../../../models/Event')).default;
    const eventData = await Event.findById(event);
    
    if (!eventData) {
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Check registration window
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (eventData.registrationStartDate) {
      const registrationStart = new Date(new Date(eventData.registrationStartDate).setHours(0, 0, 0, 0));
      if (today < registrationStart) {
        return NextResponse.json({ 
          error: `Registration has not opened yet. Registration opens on ${registrationStart.toLocaleDateString()}` 
        }, { status: 403 });
      }
    }
    
    if (eventData.registrationEndDate) {
      const registrationEnd = new Date(new Date(eventData.registrationEndDate).setHours(23, 59, 59, 999));
      if (today > registrationEnd) {
        return NextResponse.json({ 
          error: `Registration has closed. Registration closed on ${registrationEnd.toLocaleDateString()}` 
        }, { status: 403 });
      }
    }

    // Check for duplicate registrations (Leader or Team Members)
    const emailsToCheck = [leader.email];
    if (teamMembers && teamMembers.length > 0) {
      teamMembers.forEach(member => {
        if (member.email) emailsToCheck.push(member.email);
      });
    }

    const existingRegistration = await Registration.findOne({
      event,
      $or: [
        { 'leader.email': { $in: emailsToCheck } },
        { 'teamMembers.email': { $in: emailsToCheck } }
      ]
    });

    if (existingRegistration) {
      let duplicateEmail = '';
      if (emailsToCheck.includes(existingRegistration.leader.email)) {
        duplicateEmail = existingRegistration.leader.email;
      } 
      else if (existingRegistration.teamMembers) {
        const found = existingRegistration.teamMembers.find(m => emailsToCheck.includes(m.email));
        if (found) duplicateEmail = found.email;
      }

      return NextResponse.json({ 
        error: `User with email ${duplicateEmail || 'specified'} is already registered for this event.` 
      }, { status: 409 });
    }

    // Determine Status & Process Team Members
    // If team members exist, status is 'Awaiting Members'
    const hasTeam = teamMembers && teamMembers.length > 0;
    const initialStatus = hasTeam ? 'Awaiting Members' : 'Pending';

    // Generate unique QR code for leader
    const qrCode = `EVENT_${event}_USER_${leader.userId}_LEADER_${Date.now()}`;

    // Process team members (tokens + notifications)
    const processedTeamMembers = [];
    
    if (hasTeam) {
      for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i];
        const token = crypto.randomBytes(32).toString('hex');
        
        // QR Code generated but member not strictly "active" until accepted? 
        // We'll generate it now for simplicity.
        const memberQr = `EVENT_${event}_USER_${leader.userId}_MEMBER_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        processedTeamMembers.push({
          ...member,
          qrCode: memberQr,
          attended: false,
          invitationStatus: 'Pending',
          invitationToken: token
        });

        // Send Invitation Notification
        // Link: /accept-invite?token=... (Assuming we are on same host, we'll construct relative or try to guess)
        // Ideally we need the base URL. For now, we'll assume a standard path and user handles domain in email context or we hardcode.
        // Actually NotificationAPI allows standardized templates. 
        // We will pass the token and user can construct link in the template or we pass full link if we knew domain. 
        // We will pass `token` and `event_title`.
        
        const inviteLink = `http://localhost:3000/dashboard/invitations/${token}`; // TODO: Use proper env var for domain

        const notificationData = {
          notificationId: 'team_invite', // Created ad-hoc or we use a generic one
          templateId: 'team_invite', // We might need to create this or use raw parameters
          user: {
            id: member.email,
            email: "hrushitech51@gmail.com",
            number: member.phone // Format: +15005550006
          },
          mergeTags: {
             readerName: member.name || 'Team Member',
             inviterName: leader.name,
             eventName: eventData.title,
             inviteLink: inviteLink
          }
        };

        // Fallback generic email construction if template doesn't exist
        // But notificationapi is best with templates. 
        // Let's send a raw email via the 'email' channel overrides if needed or assume 'team_invite' template exists?
        // Let's use the inline email construction we used in forgot-password for reliability right now.
        
        const notificationPayload = {
            type: 'team_invite', // Just a label
            to: {
                id: member.email,
                email: "hrushitech51@gmail.com",
                number: member.phone // SMS support
            },
            email: {
                subject: `Invitation to join team for ${eventData.title}`,
                html: `
                    <div style="font-family: Arial, sans-serif;">
                        <h2>You've been invited!</h2>
                        <p>Hi ${member.name || 'there'},</p>
                        <p><strong>${leader.name}</strong> has invited you to join their team <strong>"${teamName || 'Team'}"</strong> for the event <strong>${eventData.title}</strong>.</p>
                        <p>Please click the button below to accept this invitation and complete your registration.</p>
                        <br/>
                        <a href="${inviteLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
                        <br/><br/>
                        <p>Or verify using this link: <a href="${inviteLink}">${inviteLink}</a></p>
                    </div>
                `
            },
        };
        
        if (member.phone) {
             notificationPayload.sms = {
                 message: `EventFlow: ${leader.name} invited you to join team for ${eventData.title}. Accept here: ${inviteLink}`
             };
        }

        try {
             await notificationapi.send(notificationPayload);
        } catch (err) {
            console.error('Failed to send invite:', err);
        }
      }
    }

    // Create the registration
    const newRegistration = await Registration.create({
      event,
      teamName: teamName || '',
      leader: {
        userId: leader.userId,
        name: leader.name,
        email: leader.email,
      },
      teamMembers: processedTeamMembers,
      status: initialStatus,
      checkedIn: false,
      qrCode,
    });

    return NextResponse.json(newRegistration, { status: 201 });

  } catch (error) {
    console.log('Registration error:', error);
    return NextResponse.json({ 
      error: 'Registration failed' 
    }, { status: 500 });
  }
}
