// app/api/user/[userId]/route.js
import connectDB from '../../../../utils/mongoose';
import User from '../../../../models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// GET - Fetch user profile
export async function GET(req, { params }) {
  await connectDB();
  try {
    const { userId } = await params;
    const { searchParams } = new URL(req.url);
    const verifySetup = searchParams.get('verifySetup') === 'true';
    
    // For verification, check if role and password are set
    if (verifySetup) {
      const user = await User.findById(userId).select('role password');
      if (!user) {
        return NextResponse.json({ 
          error: 'User not found' 
        }, { status: 404 });
      }
      return NextResponse.json({
        hasRole: Boolean(user.role && ['attendee', 'organizer'].includes(user.role)),
        hasPassword: Boolean(user.password)
      });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.log('Fetch user error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user' 
    }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(req, { params }) {
  await connectDB();
  try {
    const { userId } = await params;
    const updates = await req.json();
    
    // Handle password separately if provided
    const { password, ...profileUpdates } = updates;
    
    // Allowed fields
    const allowedUpdates = ['name', 'email', 'phone', 'college', 'organization', 'bio', 'avatar', 'role'];
    const updateData = {};
    
    Object.keys(profileUpdates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = profileUpdates[key];
      }
    });

    // Validate role if provided
    if (updateData.role && !['attendee', 'organizer'].includes(updateData.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Handle password update if provided
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ 
          error: 'Password must be at least 6 characters' 
        }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update' 
      }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.log('Update user error:', error);
    return NextResponse.json({ 
      error: 'Failed to update user' 
    }, { status: 500 });
  }
}

// DELETE - Delete user account
export async function DELETE(req, { params }) {
  await connectDB();
  try {
    const { userId } = await params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Delete all registrations associated with this user
    const Registration = (await import('../../../../models/Registration')).default;
    await Registration.deleteMany({ 'leader.userId': userId });

    // Delete all events created by this user (if organizer)
    const Event = (await import('../../../../models/Event')).default;
    await Event.deleteMany({ organizer: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ 
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.log('Delete user error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete account' 
    }, { status: 500 });
  }
}
