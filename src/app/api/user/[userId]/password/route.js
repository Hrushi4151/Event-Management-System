// app/api/user/[userId]/password/route.js
import connectDB from '../../../../../utils/mongoose';
import User from '../../../../../models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// PUT - Update user password
export async function PUT(req, { params }) {
  await connectDB();
  try {
    const { userId } = await params;
    const { currentPassword, newPassword } = await req.json();
    
    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'New password must be at least 6 characters' 
      }, { status: 400 });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // If user has no password (OAuth user), allow setting initial password without currentPassword
    const hasPassword = Boolean(user.password);
    if (hasPassword) {
      if (!currentPassword) {
        return NextResponse.json({ 
          error: 'Current password is required' 
        }, { status: 400 });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return NextResponse.json({ 
          error: 'Current password is incorrect' 
        }, { status: 401 });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ 
      message: hasPassword ? 'Password updated successfully' : 'Password set successfully' 
    });
  } catch (error) {
    console.log('Update password error:', error);
    return NextResponse.json({ 
      error: 'Failed to update password' 
    }, { status: 500 });
  }
}
