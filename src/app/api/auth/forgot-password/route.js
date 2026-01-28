import { NextResponse } from 'next/server';
import connectDB from '../../../../utils/mongoose';
import User from '../../../../models/User';
import notificationapi from 'notificationapi-node-server-sdk';

// Initialize NotificationAPI
notificationapi.init(
  'lguera0ob9w63bchw5ey0d7ywu',
  'u623uf4bwqpi6t98ellu260bu802rayskjdbo0gm34y43qu1kfzcxmtakz'
);

// Helper to generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in user document
    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    user.resetOTPAttempts = (user.resetOTPAttempts || 0) + 1;

    // Rate limiting: max 3 OTP requests per hour
    if (user.resetOTPAttempts > 3) {
      const lastAttemptTime = user.updatedAt;
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastAttemptTime > hourAgo) {
        return NextResponse.json(
          { error: 'Too many OTP requests. Please try again later.' },
          { status: 429 }
        );
      } else {
        // Reset attempts if more than an hour has passed
        user.resetOTPAttempts = 1;
      }
    }

    await user.save();

    // Prepare notification channels
    const channels = [];
    const notificationData = {
      type: 'password_reset',
      to: {
        id: user.email,
        email: "hrushitech51@gmail.com",
      },
      email: {
        subject: 'Password Reset OTP - Event Management',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563EB;">Password Reset Request</h2>
            <p>Hi ${user.name},</p>
            <p>You requested to reset your password. Use the following OTP to proceed:</p>
            <div style="background: #F8FAFC; border: 2px solid #2563EB; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #2563EB; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
            </div>
            <p><strong>This OTP is valid for 10 minutes.</strong></p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
            <p style="color: #64748B; font-size: 12px;">Best regards,<br>Event Management Team</p>
          </div>
        `
      }
    };

    // Add SMS if phone number exists in user profile
    if (user.phone) {
      // Format phone number to E.164 for India
      let phoneNumber = user.phone.replace(/[^\d+]/g, ''); // Keep only value digits and +
      
      // If valid number but missing country code, assume India (+91)
      if (!phoneNumber.startsWith('+')) {
        // Strip leading zeros if any (common in India like 098...)
        phoneNumber = phoneNumber.replace(/^0+/, '');
        phoneNumber = '+91' + phoneNumber;
      }
      
      notificationData.to.number = phoneNumber;
      notificationData.sms = {
        message: `Your Event Management password reset OTP is: ${otp}. Valid for 10 minutes.`
      };
      channels.push('sms');
    }

    channels.push('email');

    // Send OTP via NotificationAPI
    try {
      await notificationapi.send(notificationData);
    } catch (notifError) {
      console.error('Notification API Error:', JSON.stringify(notifError, null, 2));
      // Continue even if notification fails - OTP is still stored
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      otpSentTo: channels,
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
