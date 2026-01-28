// app/api/registration/[registrationId]/route.js
import connectDB from '../../../../utils/mongoose';
import Registration from '../../../../models/Registration';
import { NextResponse } from 'next/server';

// PUT - Update registration status or check-in status or team member attendance
export async function PUT(req, { params }) {
  await connectDB();
  try {
    const { registrationId } = await params;
    const updates = await req.json();
    
    const registration = await Registration.findById(registrationId);
    
    if (!registration) {
      return NextResponse.json({ 
        error: 'Registration not found' 
      }, { status: 404 });
    }

    // Handle team member attendance update
    if (updates.teamMemberAttendance !== undefined) {
      const { memberEmail, attended } = updates.teamMemberAttendance;
      
      if (memberEmail && typeof attended === 'boolean') {
        const memberIndex = registration.teamMembers.findIndex(
          m => m.email === memberEmail
        );
        
        if (memberIndex !== -1) {
          registration.teamMembers[memberIndex].attended = attended;
          await registration.save();
        } else {
          return NextResponse.json({ 
            error: 'Team member not found' 
          }, { status: 404 });
        }
      }
    } else {
      // Handle regular updates (status, checkedIn)
      const allowedUpdates = ['status', 'checkedIn'];
      const updateData = {};
      
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updateData[key] = updates[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ 
          error: 'No valid fields to update' 
        }, { status: 400 });
      }

      Object.assign(registration, updateData);
      await registration.save();
    }

    const updatedRegistration = await Registration.findById(registrationId)
      .populate('event', 'title startDate endDate location')
      .populate('leader.userId', 'name email');

    return NextResponse.json(updatedRegistration);
  } catch (error) {
    console.log('Update registration error:', error);
    return NextResponse.json({ 
      error: 'Failed to update registration' 
    }, { status: 500 });
  }
}

// DELETE - Cancel a registration
export async function DELETE(req, { params }) {
  await connectDB();
  try {
    const { registrationId } = await params;
    
    const deletedRegistration = await Registration.findByIdAndDelete(registrationId);
    
    if (!deletedRegistration) {
      return NextResponse.json({ 
        error: 'Registration not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Registration cancelled successfully' 
    });
  } catch (error) {
    console.log('Delete registration error:', error);
    return NextResponse.json({ 
      error: 'Failed to cancel registration' 
    }, { status: 500 });
  }
} 