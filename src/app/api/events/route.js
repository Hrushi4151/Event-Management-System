// app/api/events/route.js
import connectDB from '../../../utils/mongoose';
import Event from '../../../models/Event';
import { NextResponse } from 'next/server';


export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get('id'); // assuming 'id' is passed as a query param like ?id=123
 console.log("creatorId");
 console.log(creatorId);
  try {
    let events;
    if (creatorId) {
      events = await Event.find({ organizer : creatorId }).sort({ createdAt: -1 });
    } else {
      events = await Event.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(events);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}


// POST - Create a new event
export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    console.log('Creating event:', body);
    
    // Validate required fields
    if (!body.title || !body.startDate || !body.endDate) {
      return NextResponse.json({ 
        error: 'Title, start date, and end date are required' 
      }, { status: 400 });
    }

    // Check if an event with the same title already exists
    const existingEvent = await Event.findOne({ title: body.title });
    if (existingEvent) {
      return NextResponse.json({ 
        error: 'Event with this title already exists' 
      }, { status: 409 });
    }

    // Create the event
    const event = await Event.create(body);

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.log('Event creation error:', err);
    return NextResponse.json({ 
      error: 'Event creation failed' 
    }, { status: 500 });
  }
}
