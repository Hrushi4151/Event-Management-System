import User from "@/models/User";
import Verification from "@/models/Verification";
import connectDB from "@/utils/mongoose";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { data } = await req.json();
    await connectDB();

    // 0. Verify OTP
    if (!data.otp) {
        return NextResponse.json({ message: "Verification code is required" }, { status: 400 });
    }
    
    const verification = await Verification.findOne({ email: data.email.toLowerCase() });
    
    if (!verification || verification.otp !== data.otp) {
        return NextResponse.json({ message: "Invalid or expired verification code" }, { status: 400 });
    }

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json({ message: "Email already registered" }, { status: 409 });
    }

    // Remove verification record
    await Verification.deleteOne({ _id: verification._id });

    // 2. Hash password (if provided)
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : "";

    // 3. Create user
    const newUser = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      phone: "",
      organization: data.role === 'organizer' ? data.organization || "" : "",
      college: data.role === 'attendee' ? data.college || "" : "",
      bio: "",
      avatar: "",
    });

    // 4. Return success
    return NextResponse.json(
      { message: "Signup successful", userId: newUser._id },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
