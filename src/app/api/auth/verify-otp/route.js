import { NextResponse } from 'next/server';
import connectDB from '../../../../utils/mongoose';
import User from '../../../../models/User';

export async function POST(request) {
  try {
    await connectDB();
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 404 }
      );
    }

    // Check if OTP exists
    if (!user.resetOTP) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (new Date() > user.resetOTPExpiry) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.resetOTP !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    // Generate reset token (simple approach: use user ID + timestamp)
    const resetToken = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');
    
    // Store reset token with expiration (15 minutes)
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    
    // Clear OTP after successful verification
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: resetToken
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
