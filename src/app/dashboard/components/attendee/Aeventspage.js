'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import {
  HiCalendar,
  HiClipboardList,
  HiBadgeCheck,
  HiCheckCircle,
  HiTicket,
  HiClock,
  HiXCircle,
  HiLocationMarker,
  HiSearch,
} from 'react-icons/hi';
import { useSession } from 'next-auth/react';
import EventsCalender from '../EventsCalender';
import { TruncatedAddress } from '../TruncatedAddress';

export default function EventsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('All Events');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventData, setEventData] = useState({
    'All Events': [],
    'Newly Added': [],
    'Tickets Booked': [],
    'Events Attended': [],
    'Upcoming Events': [],
    'Expired/Cancelled': [],
    'Pending': [],
  });
  const [stats, setStats] = useState({
    ticketsBooked: 0,
    eventsAttended: 0,
    upcomingEvents: 0,
    expiredCancelled: 0,
    pendingRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  const fetchEvents = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      
      const eventsRes = await fetch('/api/events', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!eventsRes.ok) throw new Error("Failed to load events");
      const allEventsData = await eventsRes.json();
      const allEvents = (allEventsData || []).filter(event => event && event._id);

      const registrationsRes = await fetch(`/api/registration/user/${session.user.id}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!registrationsRes.ok) throw new Error("Failed to load registrations");
      const registrationsData = await registrationsRes.json();
      const registrations = (registrationsData || []).filter(reg => reg && reg.event);

      const registrationMap = {};
      registrations.forEach(reg => {
        if (!reg || !reg.event) return;
        const eventId = reg.event._id || reg.event;
        if (eventId) {
          registrationMap[eventId] = {
            status: reg.status,
            checkedIn: reg.checkedIn,
            registrationId: reg._id,
          };
        }
      });

      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const ticketsBooked = registrations.length;
      const upcomingEvents = registrations.filter(reg => {
        const event = reg.event;
        const startDate = new Date(event?.startDate);
        return startDate > now && reg.status === 'Accepted';
      }).length;
      
      const eventsAttended = registrations.filter(reg => {
        const event = reg.event;
        const endDate = new Date(event?.endDate);
        
        // Check individual attendance
        let isAttended = false;
        if (reg.leader?.email === session?.user?.email) {
            isAttended = reg.checkedIn;
        } else if (reg.teamMembers) {
            const member = reg.teamMembers.find(m => m.email === session?.user?.email);
            if (member) isAttended = member.attended;
        }
        
        return endDate < now && isAttended === true;
      }).length;
      
      const expiredCancelled = registrations.filter(reg => {
        const event = reg.event;
        const endDate = new Date(event?.endDate);
        return endDate < now || event?.status === 'Cancelled';
      }).length;
      
      const pendingRegistrations = registrations.filter(reg => reg.status === 'Pending').length;

      setStats({
        ticketsBooked,
        eventsAttended,
        upcomingEvents,
        expiredCancelled,
        pendingRegistrations,
      });

      const categorized = {
        'All Events': [],
        'Newly Added': [],
        'Tickets Booked': [],
        'Events Attended': [],
        'Upcoming Events': [],
        'Expired/Cancelled': [],
        'Pending': [],
      };

      allEvents.forEach(event => {
        const eventId = event._id;
        const registration = registrationMap[eventId];
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const createdAt = new Date(event.createdAt);
        const isExpired = endDate < now;
        const isCancelled = event.status === 'Cancelled';

        if (registration) {
          categorized['Tickets Booked'].push(event);
          
          if (registration.checkedIn && isExpired) {
            categorized['Events Attended'].push(event);
          }
          
          if (startDate > now && registration.status === 'Accepted') {
            categorized['Upcoming Events'].push(event);
          }
          
          if (isExpired || isCancelled) {
            categorized['Expired/Cancelled'].push(event);
          }
          
          if (registration.status === 'Pending') {
            categorized['Pending'].push(event);
          }
        } else {
          if (!isCancelled) {
            if (startDate > now) {
              categorized['Upcoming Events'].push(event);
            }
          }
        }

        if (!isCancelled || registration) {
          categorized['All Events'].push(event);
        }

        if (createdAt >= sevenDaysAgo && (!isCancelled || registration)) {
          categorized['Newly Added'].push(event);
        }
      });

      setEventData(categorized);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getEventDate = (event) => {
    try {
      return new Date(event.createdAt || event.startDate);
    } catch {
      return new Date();
    }
  };

  const filteredEvents = eventData[activeTab]
    .filter(event => 
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (activeTab === 'All Events' || activeTab === 'Newly Added') {
        return getEventDate(b) - getEventDate(a);
      }
      return new Date(a.startDate) - new Date(b.startDate);
    });

  const eventTabs = [
    { label: 'All Events', icon: HiCalendar, count: eventData['All Events'].length, iconBg: 'bg-indigo-600', iconColor: 'text-indigo-600', shadow: 'shadow-indigo-200' },
    { label: 'Upcoming Events', icon: HiClock, count: eventData['Upcoming Events'].length, iconBg: 'bg-blue-500', iconColor: 'text-blue-500', shadow: 'shadow-blue-200' },
    { label: 'Tickets Booked', icon: HiTicket, count: stats.ticketsBooked, iconBg: 'bg-cyan-500', iconColor: 'text-cyan-500', shadow: 'shadow-cyan-200' },
    { label: 'Events Attended', icon: HiCheckCircle, count: stats.eventsAttended, iconBg: 'bg-green-500', iconColor: 'text-green-500', shadow: 'shadow-green-200' },
    { label: 'Pending', icon: HiClipboardList, count: stats.pendingRegistrations, iconBg: 'bg-orange-500', iconColor: 'text-orange-500', shadow: 'shadow-orange-200' },
    { label: 'Expired/Cancelled', icon: HiXCircle, count: stats.expiredCancelled, iconBg: 'bg-red-500', iconColor: 'text-red-500', shadow: 'shadow-red-200' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#2563EB]"></div>
          <span className="text-lg text-[#64748B]">Loading events...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 lg:px-16 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Events</h1>
          <p className="text-[#64748B]">Discover and manage your event registrations</p>
        </div>

        {/* Stats Cards - Now serving as Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8 animate-fadeIn">
          {eventTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col items-start gap-3 text-left group ${
                  isActive 
                    ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-lg' 
                    : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${tab.iconBg} text-white ${tab.shadow}`}>
                  <Icon className="text-xl" />
                </div>
                
                <div>
                  <div className={`text-3xl font-bold mb-1 ${tab.iconColor}`}>
                    {tab.count}
                  </div>
                  <div className="text-sm font-medium text-[#64748B]">
                    {tab.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#64748B] text-xl" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl 
                       text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:ring-2 
                       focus:ring-[#2563EB] focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'bg-white text-[#64748B] border border-[#E5E7EB] hover:bg-gray-50'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                viewMode === 'calendar'
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'bg-white text-[#64748B] border border-[#E5E7EB] hover:bg-gray-50'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] animate-fadeIn">
            <EventsCalender events={filteredEvents} />
          </div>
        ) : (
          <>
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 border border-[#E5E7EB] text-center animate-fadeIn">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-[#0F172A] mb-2">No events found</h3>
                <p className="text-[#64748B]">
                  {searchQuery ? 'Try adjusting your search' : 'Check back later for new events'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {filteredEvents.map((event) => {
                  const now = new Date();
                  const startDate = new Date(event.startDate);
                  const endDate = new Date(event.endDate);
                  const isExpired = endDate < now;
                  const isCancelled = event.status === 'Cancelled';
                  const isUpcoming = startDate > now;
                  const isLive = startDate <= now && endDate >= now;

                  return (
                    <Link
                      key={event._id}
                      href={`/dashboard/events/${event._id}`}
                      className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] 
                               group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Event Image */}
                      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                        {event.bannerImage ? (
                          <img
                            src={event.bannerImage}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                            📅
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        
                        {/* Status Badge - Strategic Color Usage */}
                        <div className="absolute top-4 right-4">
                          {isCancelled ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500 text-white">
                              Closed
                            </span>
                          ) : isLive ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#10B981] text-white animate-pulse">
                              Live Event
                            </span>
                          ) : isExpired ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-400 text-white">
                              Closed
                            </span>
                          ) : isUpcoming ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#22D3EE] text-white">
                              Upcoming
                            </span>
                          ) : null}
                        </div>

                        {/* Mode Badge */}
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                            {event.mode}
                          </span>
                        </div>
                      </div>

                      {/* Event Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-[#0F172A] mb-2 line-clamp-2 group-hover:text-[#2563EB] transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-[#64748B] text-sm mb-4 line-clamp-2">
                          {event.description || 'No description available'}
                        </p>

                        {/* Event Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-[#64748B]">
                            <HiCalendar className="text-[#2563EB] flex-shrink-0" />
                            <span className="truncate">{event.startDate}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 text-[#64748B]">
                              <HiLocationMarker className="text-[#2563EB] flex-shrink-0" />
                              <TruncatedAddress address={event.location} maxLength={30} />
                            </div>
                          )}
                          {!event.isFree && (
                            <div className="flex items-center gap-2">
                              <HiTicket className="text-[#10B981] flex-shrink-0" />
                              <span className="font-semibold text-[#10B981]">
                                {event.currency === 'INR' && '₹'}
                                {event.currency === 'USD' && '$'}
                                {event.currency === 'EUR' && '€'}
                                {event.registrationFee}
                              </span>
                            </div>
                          )}
                          {event.isFree && (
                            <div className="flex items-center gap-2">
                              <HiTicket className="text-[#10B981] flex-shrink-0" />
                              <span className="font-semibold text-[#10B981]">Free Event</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
