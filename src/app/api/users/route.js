// app/api/users/route.js
import connectDB from '../../../utils/mongoose';
import User from '../../../models/User';
import { NextResponse } from 'next/server';

// GET - Fetch all users (or filtered by role)
export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // Optional filter by role
    
    let query = {};
    if (role) {
      query.role = role;
    }
    
    // Fetch users, excluding password field
    const users = await User.find(query)
      .select('-password')
      .sort({ name: 1 }); // Sort alphabetically by name
    
    return NextResponse.json(users);
  } catch (error) {
    console.log('Fetch users error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users' 
    }, { status: 500 });
  }
}
