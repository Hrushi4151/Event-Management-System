import { NextResponse } from 'next/server';
import connectDB from '../../../../utils/mongoose';
import User from '../../../../models/User';
import Verification from '../../../../models/Verification';
import notificationapi from 'notificationapi-node-server-sdk';

notificationapi.init(
  'lguera0ob9w63bchw5ey0d7ywu',
  'u623uf4bwqpi6t98ellu260bu802rayskjdbo0gm34y43qu1kfzcxmtakz'
);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered. Please login.' },
        { status: 409 }
      );
    }

    // 2. Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Store OTP (Upsert or delete old)
    await Verification.deleteMany({ email: emailLower });
    await Verification.create({
      email: emailLower,
      otp,
      expiresAt,
    });

    // 4. Send Email
    const notificationData = {
      type: 'verification', // Using a generic type or re-using logic
      to: {
        id: emailLower,
        email: "hrushitech51@gmail.com", // Keeping logic consistent with forgot-password reference
      },
      email: {
        subject: 'Verify your email - Event Management',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563EB;">Email Verification</h2>
            <p>Welcome to EventFlow! Please verify your email to complete your registration.</p>
            <div style="background: #F8FAFC; border: 2px solid #2563EB; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #2563EB; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
            </div>
            <p><strong>This code expires in 10 minutes.</strong></p>
          </div>
        `
      }
    };

    try {
        await notificationapi.send(notificationData);
    } catch (err) {
        console.error('Notification API Error:', err);
        // We generally respond success even if email fails to avoid enumerating/waiting? 
        // But for verification code, user needs it.
    }

    return NextResponse.json({ message: 'Verification code sent' });

  } catch (error) {
    console.error('Send Verification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
