// // app/api/events/[id]/route.ts
// import  connectDB  from '../../../../utils/mongoose';
// import Event from '../../../../models/Event';
// import { NextRequest, NextResponse } from 'next/server';

// export async function GET(req, { params }) {
//   await connectDB();
//   try {
//     const event = await Event.findById(params.id);
//     if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
//     return NextResponse.json(event);
//   } catch (err) {
//     return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
//   }
// }

// export async function PUT(req, { params }) {
//   await connectDB();

//   try {
//     const updates = await req.json();
//     const id=await params.id;

//     const updated = await Event.findByIdAndUpdate(id, updates, {
//       new: true,       
//       runValidators: true 
//     });

//     if (!updated) {
//       return NextResponse.json(
//         { error: "Event not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(updated);
//   } catch (err) {
//     console.error("Update error:", err);
//     return NextResponse.json(
//       { error: "Failed to update event" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
//   await connectDB();
//   try {
//     await Event.findByIdAndDelete(params.id);
//     return NextResponse.json({ message: 'Event deleted' });
//   } catch (err) {
//     return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
//   }
// }


// app/api/events/[id]/route.js
import connectDB from "../../../../utils/mongoose";
import Event from "../../../../models/Event";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" , status: 404 });
    }
    return NextResponse.json(event);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch event" },
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
    const updated = await Event.findByIdAndUpdate(id, updates, {
      new: true, // return updated doc
      runValidators: true, // validate updates
    });
    console.log(updated)
    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  try {
    const {id} = await params;
    
    // Soft delete: Mark as cancelled instead of removing from database
    const updated = await Event.findByIdAndUpdate(
      id,
      { 
        status: 'Cancelled',
        cancelledAt: new Date()
      },
      { new: true }
    );
    
    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: "Event cancelled successfully",
      event: updated 
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to cancel event" },
      { status: 500 }
    );
  }
}
