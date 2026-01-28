// app/api/event-stats/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/utils/mongoose";
import Event from "@/models/Event";
import Registration from "@/models/Registration";

export async function GET(req, { params }) {
  await connectDB();
  try {
    const {id:eventId} =await params;

    // 1. Find the event
    const event = await Event.findById(eventId).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 2. Get all registrations for this event
    const regs = await Registration.find({ event: eventId }).lean();

    const totalRegistrations = regs.length;
    const accepted = regs.filter((r) => r.status === "Accepted").length;
    const pending = regs.filter((r) => r.status === "Pending").length;
    const rejected = regs.filter((r) => r.status === "Rejected").length;

    // Total potential attendees = leader + team members (all registrations)
    const totalAttendees = regs.reduce(
      (count, reg) => count + 1 + (reg.teamMembers?.length || 0),
      0
    );

    // Actual checked-in attendees = leaders who checked in + team members marked as attended
    const checkedInAttendees = regs.reduce((count, reg) => {
      let teamCount = 0;
      // Count leader if checked in
      if (reg.checkedIn) {
        teamCount += 1;
      }
      // Count team members who are marked as attended
      if (reg.teamMembers && reg.teamMembers.length > 0) {
        teamCount += reg.teamMembers.filter(m => m.attended === true).length;
      }
      return count + teamCount;
    }, 0);
    
    // Include completed event features if they exist
    const completedFeatures = {
      winners: event.winners || [],
      eventPhotos: event.eventPhotos || [],
      highlights: event.highlights || '',
      summary: event.summary || '',
      testimonials: event.testimonials || [],
      statistics: event.statistics || {},
    };

    // 3. Prepare response
    const result = {
      eventId: event._id,
      eventName: event.title,
      eventDesc: event.description,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      registrationStartDate: event.registrationStartDate,
      registrationEndDate: event.registrationEndDate,
      actualEventDate: event.actualEventDate,
      poster: event.bannerImage,
      isFree: event.isFree,
      registrationFee: event.registrationFee,
      currency: event.currency,
      coordinates: event.coordinates,
      totalRegistrations,
      accepted,
      pending,
      rejected,
      totalAttendees, // Total potential attendees
      checkedInAttendees, // Actual checked-in attendees count
      ...completedFeatures, // Include completed event features
      teams: regs.map((r) => ({
        id: r._id.toString(), // Registration ID for updates
        registrationId: r._id.toString(), // Alias for clarity
        teamName: r.teamName,
        name: r.leader?.name || '',
        email: r.leader?.email || '',
        leader: r.leader,
        teamMembers: r.teamMembers || [], // Include attendance data
        status: r.status,
        checkedIn: r.checkedIn,
        qrCode: r.qrCode,
        event: r.event,
        createdAt: r.createdAt,
      })),
    };

    return NextResponse.json({result:result,status:200});
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch event stats", details: err.message },
      { status: 500 }
    );
  }
}
