'use client';

import { HiOutlineCalendar, HiOutlineUsers, HiOutlineUserGroup, HiPlus, HiServer, HiChartPie, HiLightningBolt, HiCamera, HiMail } from 'react-icons/hi';
import {
  HiCalendar,
  HiUsers,
  HiChartBar,
  HiUserGroup,
  HiClipboardList,
  HiDownload,
  HiRefresh,
  HiTicket
} from 'react-icons/hi';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useOrganizer } from '@/app/components/ContextProvider';
import EventsCalender from '../EventsCalender';
import { TruncatedAddress } from '../TruncatedAddress';

export default function OrganizerDashboard() {

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { organizerData, loading, refreshOrganizerData } = useOrganizer();

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (userId) {
      const interval = setInterval(() => {
        refreshOrganizerData();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [userId, refreshOrganizerData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E5E7EB] border-t-[#2563EB]"></div>
          <span className="text-[#0F172A] text-lg font-medium">Loading dashboard...</span>
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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <HiChartBar className="text-2xl text-white" />
            </div>
            Organizer Dashboard
          </h1>
          <p className="text-[#64748B] mt-2 ml-1">Manage your events and track performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshOrganizerData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#64748B] rounded-xl hover:bg-gray-50 hover:text-[#2563EB] transition-all font-medium shadow-sm"
          >
            <HiRefresh className="text-lg" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Link href={'/dashboard/events'} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 text-white group-hover:scale-110 transition-transform duration-300 shadow-blue-200 shadow-lg">
            <HiCalendar className="text-xl" />
          </div>
          <p className="text-3xl font-bold text-[#0F172A] mb-1">{organizerData?.stats?.totalEvents || 0}</p>
          <p className="text-[#64748B] font-medium text-sm">Events Created</p>
        </Link>
        
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-3 text-white group-hover:scale-110 transition-transform duration-300 shadow-green-200 shadow-lg">
            <HiUsers className="text-xl" />
          </div>
          <p className="text-3xl font-bold text-[#0F172A] mb-1">{organizerData?.stats?.totalAttendees || 0}</p>
          <p className="text-[#64748B] font-medium text-sm">Total Attendees</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-3 text-white group-hover:scale-110 transition-transform duration-300 shadow-cyan-200 shadow-lg">
            <HiTicket className="text-xl" />
          </div>
          <p className="text-3xl font-bold text-[#0F172A] mb-1">{organizerData?.stats?.ticketsDistributed || 0}</p>
          <p className="text-[#64748B] font-medium text-sm">Tickets Distributed</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-3 text-white group-hover:scale-110 transition-transform duration-300 shadow-purple-200 shadow-lg">
            <HiChartBar className="text-xl" />
          </div>
          <p className="text-3xl font-bold text-[#0F172A] mb-1">{organizerData?.stats?.attendanceRate || 0}%</p>
          <p className="text-[#64748B] font-medium text-sm">Attendance Rate</p>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
              <HiLightningBolt className="text-xl" />
            </div>
            <p className="text-[#64748B] text-sm font-semibold uppercase tracking-wider">Top Performing Event</p>
          </div>
          <p className="text-lg font-bold text-[#0F172A]">
            {organizerData?.stats?.topPerformingEvent?.title 
              ? organizerData.stats.topPerformingEvent.title
              : 'No data available'}
          </p>
          {organizerData?.stats?.topPerformingEvent?.title && (
            <div className="mt-2 text-sm text-[#64748B]">
              <span className="font-semibold text-green-600">{organizerData.stats.topPerformingEvent.attendees}</span> attendees
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <HiCalendar className="text-xl" />
            </div>
            <p className="text-[#64748B] text-sm font-semibold uppercase tracking-wider">Longest Ongoing Event</p>
          </div>
          <p className="text-lg font-bold text-[#0F172A]">
            {organizerData?.stats?.longestOngoingEvent?.title
              ? organizerData.stats.longestOngoingEvent.title.charAt(0).toUpperCase() + organizerData.stats.longestOngoingEvent.title.slice(1)
              : 'No data available'}
          </p>
          {organizerData?.stats?.longestOngoingEvent?.title && (
            <div className="mt-2 text-sm text-[#64748B]">
              Duration: <span className="font-semibold text-indigo-600">{Math.floor((organizerData.stats.longestOngoingEvent.duration || 0) / (1000 * 60 * 60 * 24))} days</span>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
              <HiUserGroup className="text-xl" />
            </div>
            <p className="text-[#64748B] text-sm font-semibold uppercase tracking-wider">Total Feedback</p>
          </div>
          <p className="text-3xl font-bold text-[#0F172A]">{organizerData?.stats?.totalFeedbacks || 0}</p>
          <p className="text-sm text-[#64748B] mt-1">Reviews received</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
        <HiLightningBolt className="text-[#2563EB]" />
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Link href="/dashboard/create-event" className="flex items-center justify-center gap-3 p-4 bg-white border border-[#E5E7EB] rounded-2xl hover:border-blue-500 hover:shadow-md group transition-all">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
            <HiPlus className="text-blue-600 group-hover:text-white text-xl transition-colors" />
          </div>
          <span className="font-semibold text-[#0F172A] group-hover:text-blue-600">Create Event</span>
        </Link>

        <Link href="/dashboard/analytics" className="flex items-center justify-center gap-3 p-4 bg-white border border-[#E5E7EB] rounded-2xl hover:border-green-500 hover:shadow-md group transition-all">
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
            <HiChartPie className="text-green-600 group-hover:text-white text-xl transition-colors" />
          </div>
          <span className="font-semibold text-[#0F172A] group-hover:text-green-600">View Analytics</span>
        </Link>

        <Link href="/dashboard/email-participants" className="flex items-center justify-center gap-3 p-4 bg-white border border-[#E5E7EB] rounded-2xl hover:border-yellow-500 hover:shadow-md group transition-all">
          <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center group-hover:bg-yellow-600 transition-colors">
            <HiMail className="text-yellow-600 group-hover:text-white text-xl transition-colors" />
          </div>
          <span className="font-semibold text-[#0F172A] group-hover:text-yellow-600">Email Participants</span>
        </Link>
        
        <Link href="/dashboard/upload-photos" className="flex items-center justify-center gap-3 p-4 bg-white border border-[#E5E7EB] rounded-2xl hover:border-pink-500 hover:shadow-md group transition-all">
          <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center group-hover:bg-pink-600 transition-colors">
            <HiCamera className="text-pink-600 group-hover:text-white text-xl transition-colors" />
          </div>
          <span className="font-semibold text-[#0F172A] group-hover:text-pink-600">Upload Photos</span>
        </Link>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-4 mb-10">
        <button 
          onClick={() => {
            const allEvents = [
              ...(organizerData?.categorizedEvents?.upcoming || []),
              ...(organizerData?.categorizedEvents?.active || []),
              ...(organizerData?.categorizedEvents?.completed || []),
              ...(organizerData?.categorizedEvents?.cancelled || []),
            ];
            
            let csv = 'Event Title,Description,Location,Start Date,End Date,Mode,Status,Capacity\n';
            allEvents.forEach(event => {
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
            link.setAttribute('download', `events_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#64748B] rounded-xl hover:bg-gray-50 hover:text-[#0F172A] transition-all font-medium text-sm"
        >
          <HiDownload className="text-lg" /> Export Events (CSV)
        </button>
        <button 
          onClick={() => {
            const analyticsData = {
              stats: organizerData?.stats || {},
              events: {
                total: organizerData?.stats?.totalEvents || 0,
                upcoming: organizerData?.categorizedEvents?.upcoming?.length || 0,
                active: organizerData?.categorizedEvents?.active?.length || 0,
                completed: organizerData?.categorizedEvents?.completed?.length || 0,
                cancelled: organizerData?.categorizedEvents?.cancelled?.length || 0,
              },
              attendees: organizerData?.stats?.totalAttendees || 0,
              tickets: organizerData?.stats?.ticketsDistributed || 0,
              attendanceRate: organizerData?.stats?.attendanceRate || 0,
              exportDate: new Date().toISOString(),
            };
            
            const dataStr = JSON.stringify(analyticsData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `analytics_export_${new Date().toISOString().split('T')[0]}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#64748B] rounded-xl hover:bg-gray-50 hover:text-[#0F172A] transition-all font-medium text-sm"
        >
          <HiDownload className="text-lg" /> Export Analytics (JSON)
        </button>
      </div>

      {/* Upcoming Events Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden mb-10">
        <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <HiCalendar className="text-[#2563EB]" />
            Upcoming Events
          </h2>
          <Link href="/dashboard/events" className="text-sm font-semibold text-[#2563EB] hover:text-blue-700">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC]">
              <tr className="text-left text-[#64748B] border-b border-[#E5E7EB]">
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Event</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Start Date</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">End Date</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Location</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {organizerData?.categorizedEvents?.upcoming && organizerData.categorizedEvents.upcoming.map((event) => (
                <tr key={event.id} className="odd:bg-white even:bg-blue-100 hover:bg-blue-200/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-[#0F172A]">{event.title.charAt(0).toUpperCase() + event.title.slice(1)}</td>
                  <td className="py-4 px-6 text-[#64748B] font-medium">{event.startDate}</td>
                  <td className="py-4 px-6 text-[#64748B] font-medium">{event.endDate}</td>
                  <td className="py-4 px-6 text-[#64748B]">
                    <div className="flex items-center gap-1">
                      <TruncatedAddress 
                        address={event.location.charAt(0).toUpperCase() + event.location.slice(1)}
                        maxLength={30}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Link
                      href={`/dashboard/events/${event._id}`}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {organizerData?.categorizedEvents?.upcoming && organizerData.categorizedEvents.upcoming.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-[#64748B] py-12">
                    <div className="flex flex-col items-center">
                      <HiOutlineCalendar className="text-4xl text-gray-300 mb-3" />
                      <p>No upcoming events found.</p>
                      <Link href="/dashboard/create-event" className="mt-4 text-[#2563EB] font-semibold hover:underline">Create your first event</Link>
                    </div>
                  </td>
                </tr>
              )} 
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Calendar */}
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
          <HiCalendar className="text-purple-600" />
          Event Calendar
        </h2>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-2">
          <EventsCalender 
            events={[
              ...(organizerData?.categorizedEvents?.upcoming || []),
              ...(organizerData?.categorizedEvents?.active || []),
              ...(organizerData?.categorizedEvents?.completed || []),
              ...(organizerData?.categorizedEvents?.cancelled || []),
            ]} 
          />
        </div>
      </div>
    </div>
  );
}
