import { NextResponse } from 'next/server';
import connectDB from '../../../../utils/mongoose';
import Event from '@/models/Event';
import Registration from '@/models/Registration';
// import Feedback from '@/models/Feedback'; // Uncomment if you have this

export async function GET(req, { params }) {
  await connectDB();

  try {
    const {id:organizerId} =await params;

    // 1️⃣ Fetch all events for this organizer
    const events = await Event.find({ organizer: organizerId }).lean();
    const eventIds = events.map(e => e._id);

    const registrations = await Registration.find({ event: { $in: eventIds } }).lean();

    // 3️⃣ Stats
    const totalEvents = events.length;
    const totalAttendees = registrations.reduce(
      (count, reg) => count + 1 + (reg.teamMembers?.length || 0),
      0
    );
    const ticketsDistributed = registrations.length;

    // Categorize events based on dates, not status property
    const now = new Date();
    
    const cancelledEventsArr = events.filter(e => e.status === 'Cancelled');
    
    // Upcoming: Events that haven't started yet (startDate > now)
    const upcomingEventsArr = events.filter(e => {
      const startDate = new Date(e.startDate);
      return startDate > now && e.status !== 'Cancelled';
    });
    
    // Active: Events that have started but not ended (startDate <= now < endDate)
    const activeEventsArr = events.filter(e => {
      const startDate = new Date(e.startDate);
      const endDate = new Date(e.endDate);
      return startDate <= now && endDate >= now && e.status !== 'Cancelled';
    });
    
    // Completed: Events that have ended (endDate < now)
    const completedEventsArr = events.filter(e => {
      const endDate = new Date(e.endDate);
      return endDate < now && e.status !== 'Cancelled';
    });

    // 4️⃣ Count each
    const cancelledEvents = cancelledEventsArr.length;
    const upcomingEvents = upcomingEventsArr.length;
    const activeEvents = activeEventsArr.length;
    const completedEvents = completedEventsArr.length;

    // 5️⃣ Top Performing Event
    let topPerformingEvent = null;
    let maxAttendees = 0;
    events.forEach(event => {
      const count = registrations
        .filter(r => r.event.toString() === event._id.toString())
        .reduce((c, reg) => c + 1 + (reg.teamMembers?.length || 0), 0);
      if (count > maxAttendees) {
        maxAttendees = count;
        topPerformingEvent = { title: event.title, attendees: count };
      }
    });

    // 6️⃣ Longest Ongoing Event
    const longestOngoingEvent = events.reduce((longest, event) => {
      const duration =
        new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
      if (!longest || duration > longest.duration) {
        return { title: event.title, duration };
      }
      return longest;
    }, null);

    // 7️⃣ Feedback count
    let totalFeedbacks = 0;
    try {
      totalFeedbacks = await Feedback.countDocuments({ event: { $in: eventIds } });
    } catch {
      totalFeedbacks = 0;
    }

    // 8️⃣ Return everything
    return NextResponse.json({
      stats: {
        totalEvents,
        totalAttendees,
        ticketsDistributed,
        cancelledEvents,
        upcomingEvents,
        activeEvents,
        completedEvents,
        topPerformingEvent,
        longestOngoingEvent,
        totalFeedbacks
      },
      categorizedEvents: {
        cancelled: cancelledEventsArr,
        upcoming: upcomingEventsArr,
        active: activeEventsArr,
        completed: completedEventsArr
      }
    });

  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch organizer stats', details: err.message },
      { status: 500 }
    );
  }
}
