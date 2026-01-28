'use client';

import { useState, useEffect } from 'react';
import { HiTicket, HiClock, HiLocationMarker, HiCheckCircle, HiXCircle, HiQrcode, HiEye, HiUser, HiDownload, HiRefresh, HiCalendar, HiX } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';

export default function MyTicketsPage() {
  const [selectedQR, setSelectedQR] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTickets();
      // Auto-refresh every 30 seconds to show new registrations
      const interval = setInterval(() => {
        fetchTickets();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E5E7EB] border-t-[#2563EB]"></div>
          <span className="text-[#0F172A] text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return null; // Will redirect via useEffect
  }

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/registration/user/${session.user.id}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch tickets');
      
      const registrationsData = await res.json();
      
      // Filter out null or invalid registrations
      const validRegistrations = (registrationsData || []).filter(reg => 
        reg && reg.event && reg.leader
      );
      
      // Transform registrations into ticket format - show ALL registered events
      const formattedTickets = validRegistrations.map((reg) => {
        const event = reg.event;
        const team = [
          {
            name: reg.leader?.name || 'Unknown',
            role: 'Leader',
            email: reg.leader?.email || '',
            qrCode: reg.qrCode, // Leader's QR code
            attended: reg.checkedIn || false,
          },
          ...(reg.teamMembers || []).map((member) => ({
            name: member.name || 'Unknown',
            role: 'Member',
            email: member.email || '',
            qrCode: member.qrCode, // Individual member QR code
            attended: member.attended || false,
          })),
        ];

        const currentUserEmail = session?.user?.email;
        const isLeader = reg.leader?.email === currentUserEmail;
        
        let userQrCode = reg.qrCode; // Default to leader's/group QR
        let isCheckedIn = reg.checkedIn; // Default to main check-in

        // If not leader, try to find in team members to get individual QR/Status
        if (!isLeader && reg.teamMembers) {
           const member = reg.teamMembers.find(m => m.email === currentUserEmail);
           if (member) {
               userQrCode = member.qrCode;
               isCheckedIn = member.attended;
           }
        }

        return {
          id: reg._id,
          registrationId: reg._id,
          eventId: event?._id || event || 'unknown',
          title: event?.title || 'Unknown Event',
          date: event?.startDate || 'TBD',
          endDate: event?.endDate || 'TBD',
          venue: event?.location || 'TBD',
          mode: event?.mode || 'Offline',
          status: reg.status === 'Accepted' ? 'active' : reg.status === 'Rejected' ? 'rejected' : 'pending',
          checkedIn: isCheckedIn || false,
          qrCode: userQrCode || '', 
          teamName: reg.teamName || '',
          team,
          createdAt: reg.createdAt,
          registrationStatus: reg.status,
        };
      });

      // Sort by creation date (newest first)
      formattedTickets.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E5E7EB] border-t-[#2563EB]"></div>
          <span className="text-[#0F172A] text-lg font-medium">Loading tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A] flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <HiTicket className="text-2xl text-white" />
              </div>
              My Tickets
            </h1>
            <p className="text-[#64748B] mt-2">
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} found
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                let csv = 'Event Title,Date,End Date,Venue,Mode,Status,Team Name,Leader Name,Leader Email,Total Team Members,Registration Date\n';
                tickets.forEach(ticket => {
                  const totalMembers = ticket.team?.length || 1;
                  const row = [
                    `"${(ticket.title || 'Unknown').replace(/"/g, '""')}"`,
                    ticket.date || 'TBD',
                    ticket.endDate && ticket.endDate !== ticket.date ? ticket.endDate : '',
                    `"${(ticket.venue || 'TBD').replace(/"/g, '""')}"`,
                    ticket.mode || 'Offline',
                    ticket.status || 'pending',
                    `"${(ticket.teamName || '').replace(/"/g, '""')}"`,
                    `"${(ticket.team?.[0]?.name || 'Unknown').replace(/"/g, '""')}"`,
                    `"${(ticket.team?.[0]?.email || '').replace(/"/g, '""')}"`,
                    totalMembers,
                    ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '',
                  ].join(',');
                  csv += row + '\n';
                });
                
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `my_tickets_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              disabled={tickets.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#0F172A] rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <HiDownload className="text-lg" />
              Export CSV
            </button>
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#0F172A] rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 font-medium"
            >
              <HiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="max-w-7xl mx-auto">
        {tickets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E5E7EB]">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiTicket className="text-4xl text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-[#0F172A] mb-2">No tickets found</p>
            <p className="text-[#64748B]">Register for events to see your tickets here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 hover:shadow-lg transition-all duration-300">
                {/* Ticket Header */}
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                    <HiTicket className="text-[#2563EB]" />
                    {ticket.title}
                  </h2>
                  
                  {/* Status Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      ticket.status === 'active'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : ticket.status === 'pending'
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                      {ticket.status === 'active' && <HiCheckCircle />}
                      {ticket.status === 'pending' && <HiClock />}
                      {ticket.status === 'rejected' && <HiXCircle />}
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-[#64748B]">
                      <HiClock className="text-[#2563EB]" />
                      <span className="font-medium">{ticket.date}</span>
                      {ticket.endDate && ticket.endDate !== ticket.date && (
                        <span>- {ticket.endDate}</span>
                      )}
                    </p>
                    <p className="flex items-center gap-2 text-[#64748B]">
                      <HiLocationMarker className="text-[#2563EB]" />
                      <span className="font-medium truncate">{ticket.venue}</span>
                    </p>
                  </div>
                </div>

                {/* QR Code Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                  <div className="flex items-center gap-4">
                    {ticket.qrCode ? (
                      <div 
                        className="w-20 h-20 bg-white p-1 rounded-lg cursor-pointer flex items-center justify-center flex-shrink-0 border-2 border-[#2563EB]"
                        onClick={() => setSelectedQR(ticket)}
                      >
                        <QRCodeSVG
                          value={ticket.qrCode}
                          size={72}
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <HiQrcode className="text-3xl text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#0F172A] mb-1">Entry QR Code</p>
                      <p className="text-xs text-[#64748B]">Show this at event entrance</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/events/${ticket.eventId}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    <HiEye />
                    View Event
                  </button>
                  <button
                    onClick={() => setSelectedQR(ticket)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white border-2 border-[#2563EB] text-[#2563EB] rounded-xl hover:bg-blue-50 transition-all duration-300"
                  >
                    <HiQrcode />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal - Redesigned */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-scaleIn">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-6 rounded-t-3xl z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <HiTicket className="text-3xl" />
                    Ticket Details
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">{selectedQR.title}</p>
                </div>
                <button
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                  onClick={() => setSelectedQR(null)}
                >
                  <HiX className="text-2xl" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - QR Code */}
                <div className="flex flex-col items-center">
                  {selectedQR.qrCode ? (
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-2xl border-2 border-blue-200">
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <QRCodeSVG
                          value={selectedQR.qrCode}
                          size={220}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <div className="mt-6 text-center">
                        <p className="text-sm font-semibold text-gray-700 mb-2">QR Code ID</p>
                        <p className="text-xs font-mono bg-white px-4 py-2 rounded-lg text-gray-600 border border-gray-200 break-all">
                          {selectedQR.qrCode}
                        </p>
                        <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Show this QR code at the event entrance
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <HiQrcode className="text-6xl text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Right Column - Event Info */}
                <div className="space-y-6">
                  {/* Event Details Card */}
                  <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <HiCalendar className="text-blue-600 text-xl" />
                        Event Information
                      </h3>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 font-medium">Date</span>
                        <span className="font-semibold text-gray-900">{selectedQR.date}</span>
                      </div>
                      {selectedQR.endDate && selectedQR.endDate !== selectedQR.date && (
                        <>
                          <div className="h-px bg-gray-200"></div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 font-medium">End Date</span>
                            <span className="font-semibold text-gray-900">{selectedQR.endDate}</span>
                          </div>
                        </>
                      )}
                      <div className="h-px bg-gray-200"></div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 font-medium">Venue</span>
                        <span className="font-semibold text-gray-900 text-right max-w-xs">{selectedQR.venue}</span>
                      </div>
                      <div className="h-px bg-gray-200"></div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 font-medium">Mode</span>
                        <span className="font-semibold text-gray-900">{selectedQR.mode}</span>
                      </div>
                      <div className="h-px bg-gray-200"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 font-medium">Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedQR.status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' :
                          selectedQR.status === 'pending' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                          'bg-red-100 text-red-700 border border-red-300'
                        }`}>
                          {selectedQR.status.charAt(0).toUpperCase() + selectedQR.status.slice(1)}
                        </span>
                      </div>
                      {selectedQR.teamName && (
                        <>
                          <div className="h-px bg-gray-200"></div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 font-medium">Team Name</span>
                            <span className="font-semibold text-gray-900">{selectedQR.teamName}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Team Members Card */}
                  <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <HiUser className="text-purple-600 text-xl" />
                        Team Members ({selectedQR.team?.length || 0})
                      </h3>
                    </div>
                    <div className="p-6 max-h-80 overflow-y-auto">
                      <div className="space-y-3">
                        {selectedQR.team && selectedQR.team.map((member, idx) => (
                          <div key={idx} className="bg-gradient-to-r from-gray-50 to-purple-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                {member.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 text-sm">{member.name}</div>
                                <div className="text-xs text-gray-500">{member.email}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                                    {member.role}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                                    member.attended ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {member.attended ? 'Attended' : 'Not Attended'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {member.qrCode && (
                              <div className="pt-3 border-t border-gray-200 flex flex-col items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">Individual QR Code</span>
                                <div className="bg-white p-2 rounded-lg border border-gray-200">
                                  <QRCodeSVG
                                    value={member.qrCode}
                                    size={100}
                                    level="H"
                                    includeMargin={true}
                                  />
                                </div>
                                <p className="text-xs font-mono text-gray-500 break-all text-center">{member.qrCode}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={() => setSelectedQR(null)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <HiCheckCircle className="text-xl" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
