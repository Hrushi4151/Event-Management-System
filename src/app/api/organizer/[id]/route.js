
import connectDB from "../../../../utils/mongoose";
import User from "../../../../models/User";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" , status: 404 });
    }
    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch User" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  await connectDB();
  try {
    const updates = await req.json();
    const {id} =await params;

    console.log(updates);
    const updated = await User.findByIdAndUpdate(id, updates, {
      new: true, // return updated doc
      runValidators: true, // validate updates
    });
    console.log(updated)
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json(
      { error: "Failed to update User" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  try {
    const {id} =await params;
    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "User deleted" });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete User" },
      { status: 500 }
    );
  }
}
