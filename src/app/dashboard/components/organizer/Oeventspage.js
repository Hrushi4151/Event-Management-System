'use client';

import { useOrganizer } from '@/app/components/ContextProvider';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  HiCalendar,
  HiCheckCircle,
  HiExclamationCircle,
  HiClock,
  HiDownload,
  HiSearch,
  HiRefresh,
  HiFilter
} from 'react-icons/hi';
import EventsCalender from '../EventsCalender';
import { TruncatedAddress } from '../TruncatedAddress';

const tabs = [
  { label: 'All Events', iconBg: 'bg-indigo-500', iconColor: 'text-white', shadow: 'shadow-indigo-200', icon: <HiCalendar /> },
  { label: 'Upcoming', iconBg: 'bg-blue-500', iconColor: 'text-white', shadow: 'shadow-blue-200', icon: <HiCalendar /> },
  { label: 'Active', iconBg: 'bg-yellow-500', iconColor: 'text-white', shadow: 'shadow-yellow-200', icon: <HiClock /> },
  { label: 'Completed', iconBg: 'bg-green-500', iconColor: 'text-white', shadow: 'shadow-green-200', icon: <HiCheckCircle /> },
  { label: 'Cancelled', iconBg: 'bg-red-500', iconColor: 'text-white', shadow: 'shadow-red-200', icon: <HiExclamationCircle /> },
  { label: 'Calendar View', iconBg: 'bg-purple-500', iconColor: 'text-white', shadow: 'shadow-purple-200', icon: <HiCalendar /> },
];

export default function EventStatsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [activeTab, setActiveTab] = useState("All Events");
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState({
    'All Events': [],
    Upcoming: [],
    Active: [],
    Completed: [],
    Cancelled: [],
    'Calendar View': [],
  });
  
  const { organizerData, loading, refreshOrganizerData } = useOrganizer();
  
  useEffect(() => {
    if (organizerData?.categorizedEvents) {
      // Re-categorize based on current date to ensure real-time accuracy
      const now = new Date();
      const allEvents = [
        ...(organizerData.categorizedEvents.upcoming || []),
        ...(organizerData.categorizedEvents.active || []),
        ...(organizerData.categorizedEvents.completed || []),
        ...(organizerData.categorizedEvents.cancelled || []),
      ];

      const categorized = {
        'All Events': [...allEvents], // All events regardless of status
        Upcoming: [],
        Active: [],
        Completed: [],
        Cancelled: [],
        'Calendar View': [...allEvents],
      };

      allEvents.forEach(event => {
        // Cancelled events stay cancelled
        if (event.status === 'Cancelled') {
          categorized.Cancelled.push(event);
          return;
        }

        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        // Upcoming: Events that haven't started yet
        if (startDate > now) {
          categorized.Upcoming.push(event);
        }
        // Active: Events currently happening
        else if (startDate <= now && endDate >= now) {
          categorized.Active.push(event);
        }
        // Completed: Events that have ended
        else if (endDate < now) {
          categorized.Completed.push(event);
        }
      });

      // Sort "All Events" by creation date (newest first)
      categorized['All Events'].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setEvents(categorized);
    }
  }, [organizerData]); 

  // Auto-refresh every 30 seconds and on component mount
  useEffect(() => {
    if (userId) {
      refreshOrganizerData();
      const interval = setInterval(() => {
        refreshOrganizerData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, refreshOrganizerData]);
  
  const filteredEvents = events[activeTab]?.filter((event) =>
    event?.title?.toLowerCase()?.includes(searchQuery.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E5E7EB] border-t-[#2563EB]"></div>
          <span className="text-[#0F172A] text-lg font-medium">Loading events...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-[#2563EB]">
              <HiCalendar className="text-2xl" />
            </div>
            Manage Events
          </h1>
          <p className="text-[#64748B] mt-2 ml-1">View, track, and manage all your events</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshOrganizerData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#64748B] rounded-xl hover:bg-gray-50 hover:text-[#2563EB] transition-all font-medium shadow-sm hover:shadow-md"
          >
            <HiRefresh className="text-lg" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              setActiveTab(tab.label);
              setSearchQuery('');
            }}
            className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col items-start gap-3 text-left group ${
              activeTab === tab.label 
                ? `bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-lg`
                : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${tab.iconBg} ${tab.iconColor} ${tab.shadow}`}>
              {tab.icon}
            </div>
            
            <div>
              <div className="text-3xl font-bold text-[#0F172A] mb-1">
                {tab.label === 'Calendar View' ? <span className="text-2xl">📅</span> : (events[tab.label]?.length || 0)}
              </div>
              <div className="text-sm font-medium text-[#64748B]">
                {tab.label}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xl shadow-blue-900/5 overflow-hidden min-h-[500px] animate-fadeIn">
        {/* Toolbar */}
        {activeTab !== 'Calendar View' && (
          <div className="p-6 border-b border-[#E5E7EB] flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 backdrop-blur-sm">
            <div className="relative w-full md:w-96 group">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search events by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-[#0F172A] shadow-sm"
              />
            </div>
            <button
              onClick={() => {
                const eventsToExport = filteredEvents.length > 0 ? filteredEvents : (events[activeTab] || []);
                let csv = 'Event Title,Description,Location,Start Date,End Date,Mode,Status,Capacity\n';
                eventsToExport.forEach(event => {
                  const row = [
                    `"${(event.title || '').replace(/"/g, '""')}"`,
                    `"${(event.description || '').replace(/"/g, '""')}"`,
                    `"${(event.location || '').replace(/"/g, '""')}"`,
                    event.startDate || '',
                    event.endDate || '',
                    event.mode || 'Offline',
                    event.status || 'Upcoming',
                    event.capacity || '',
                  ].join(',');
                  csv += row + '\n';
                });
                
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `${activeTab}_events_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              disabled={filteredEvents.length === 0 && (!events[activeTab] || events[activeTab].length === 0)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E5E7EB] text-[#0F172A] font-medium rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              <HiDownload className="text-lg" />
              Export CSV
            </button>
          </div>
        )}

        {/* List View */}
        {activeTab !== 'Calendar View' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-100 border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-4 px-6 text-left font-semibold text-[#64748B] uppercase tracking-wider text-xs">Event Details</th>
                  <th className="py-4 px-6 text-left font-semibold text-[#64748B] uppercase tracking-wider text-xs">Date & Time</th>
                  <th className="py-4 px-6 text-left font-semibold text-[#64748B] uppercase tracking-wider text-xs">Location</th>
                  <th className="py-4 px-6 text-left font-semibold text-[#64748B] uppercase tracking-wider text-xs">Registrations</th>
                  <th className="py-4 px-6 text-left font-semibold text-[#64748B] uppercase tracking-wider text-xs">Fee</th>
                  <th className="py-4 px-6 text-left font-semibold text-[#64748B] uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <tr 
                      key={event._id} 
                      className="group odd:bg-white even:bg-blue-100 hover:bg-blue-200/50 transition-all border-l-4 border-transparent hover:border-blue-500"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#0F172A] text-base mb-1">{event.title}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          event.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                          event.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          event.status === 'Active' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {event.status || 'Upcoming'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-[#64748B]">
                          <span className="font-medium text-[#0F172A]">{event.startDate}</span>
                          <span className="text-xs">to {event.endDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#64748B]">
                        <TruncatedAddress 
                          address={event.location}
                          maxLength={30}
                        />
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                           <span className="font-bold text-[#0F172A]">{event.registrations || 0}</span>
                           <span className="text-xs text-[#64748B]">attendees</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          (event.isFree === false || event.isFree === 'false' || event.registrationFee > 0) ? 'text-[#0F172A]' : 'text-green-600'
                        }`}>
                          {(event.isFree === false || event.isFree === 'false' || event.registrationFee > 0) ? `${event.currency === 'INR' ? '₹' : '$'}${event.registrationFee}` : 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/events/${event._id}`}
                          className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-all"
                        >
                          Manage <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-[#64748B]">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <HiFilter className="text-2xl text-gray-300" />
                        </div>
                        <p className="text-lg font-medium text-[#0F172A]">No events found</p>
                        <p className="text-sm">Try adjusting your search or filter</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Calendar View */}
        {activeTab === 'Calendar View' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
              <HiCalendar className="text-purple-600" />
              Calendar Overview
            </h2>
            <div className="bg-[#F8FAFC] rounded-xl p-2 border border-[#E5E7EB]">
              <EventsCalender 
                events={events['Calendar View'].map(event => ({
                  ...event,
                  registration: event.registration
                }))} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
