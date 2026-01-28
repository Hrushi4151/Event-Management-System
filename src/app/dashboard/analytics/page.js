'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOrganizer } from '@/app/components/ContextProvider';
import { 
  HiChartBar, 
  HiCalendar, 
  HiUserGroup, 
  HiRefresh, 
  HiDownload,
  HiTicket,
  HiLightningBolt,
  HiChartPie
} from 'react-icons/hi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsPage() {
  const router = useRouter();
  const { status } = useSession();
  const { organizerData, loading: contextLoading, refreshOrganizerData } = useOrganizer();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated' && !contextLoading) setLoading(false);
  }, [status, contextLoading, router]);

  // Real-time auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
        refreshOrganizerData();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshOrganizerData]);

  const analytics = useMemo(() => {
    if (!organizerData) return null;

    const allEvents = [
        ...(organizerData.categorizedEvents?.upcoming || []),
        ...(organizerData.categorizedEvents?.active || []),
        ...(organizerData.categorizedEvents?.completed || []),
        ...(organizerData.categorizedEvents?.cancelled || []),
    ];

    // 1. Status Distribution
    const statusCounts = {
        Upcoming: organizerData.categorizedEvents?.upcoming?.length || 0,
        Active: organizerData.categorizedEvents?.active?.length || 0,
        Completed: organizerData.categorizedEvents?.completed?.length || 0,
        Cancelled: organizerData.categorizedEvents?.cancelled?.length || 0,
    };

    // 2. Top Events by Attendees
    const sortedByMembers = [...allEvents].sort((a, b) => (b.attendees || 0) - (a.attendees || 0)).slice(0, 5);
    
    // 3. Mode Distribution
    const modeCounts = allEvents.reduce((acc, curr) => {
        const m = curr.mode || 'Offline';
        acc[m] = (acc[m] || 0) + 1;
        return acc;
    }, {});

    // 4. Timeline (Dummy Logic as we don't have creation dates in simple list often, but assuming we might use StartDate)
    // We'll Group by Month of StartDate
    const months = {};
    allEvents.forEach(e => {
        if(e.startDate) {
            const d = new Date(e.startDate);
            const key = d.toLocaleString('default', { month: 'short' });
            months[key] = (months[key] || 0) + 1;
        }
    });
    // Sort months manually or simple order
    const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const timelineLabels = monthOrder.filter(m => months[m] !== undefined);
    const timelineData = timelineLabels.map(m => months[m]);

    return { statusCounts, sortedByMembers, modeCounts, timelineLabels, timelineData, allEvents };

  }, [organizerData]);

  const statusChartData = {
    labels: Object.keys(analytics?.statusCounts || {}),
    datasets: [{
        data: Object.values(analytics?.statusCounts || {}),
        backgroundColor: ['#3B82F6', '#10B981', '#6366F1', '#EF4444'],
        borderWidth: 0,
    }]
  };

  const topEventsChartData = {
      labels: analytics?.sortedByMembers.map(e => e.title.length > 15 ? e.title.substring(0,15)+'...' : e.title) || [],
      datasets: [{
          label: 'Attendees',
          data: analytics?.sortedByMembers.map(e => e.attendees || 0) || [],
          backgroundColor: '#8B5CF6',
          borderRadius: 8,
      }]
  };

  const timelineChartData = {
      labels: analytics?.timelineLabels || [],
      datasets: [{
          fill: true,
          label: 'Events Scheduled',
          data: analytics?.timelineData || [],
          borderColor: '#0EA5E9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          tension: 0.4,
      }]
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E5E7EB] border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-[#0F172A] flex items-center gap-3">
             <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <HiChartPie className="text-2xl" />
             </div>
             Analytics Dashboard
           </h1>
           <p className="text-[#64748B] mt-1 ml-1">Real-time insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
            <button onClick={refreshOrganizerData} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-blue-600 hover:border-blue-200 transition flex items-center gap-2 font-medium shadow-sm">
                <HiRefresh className="text-lg" /> Refresh
            </button>
            <button className="px-4 py-2 bg-[#0F172A] text-white rounded-xl hover:bg-gray-800 transition flex items-center gap-2 font-medium shadow-lg">
                <HiDownload className="text-lg" /> Export Report
            </button>
        </div>
      </div>

      {/* Mini Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
             <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-200">
                 <HiCalendar className="text-xl" />
             </div>
             <p className="text-3xl font-bold text-[#0F172A]">{organizerData?.stats?.totalEvents || 0}</p>
             <p className="text-sm text-gray-500 font-medium">Total Events</p>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
             <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-green-200">
                 <HiUserGroup className="text-xl" />
             </div>
             <p className="text-3xl font-bold text-[#0F172A]">{organizerData?.stats?.totalAttendees || 0}</p>
             <p className="text-sm text-gray-500 font-medium">Total Attendees</p>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
             <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-purple-200">
                 <HiChartBar className="text-xl" />
             </div>
             <p className="text-3xl font-bold text-[#0F172A]">{organizerData?.stats?.attendanceRate || 0}%</p>
             <p className="text-sm text-gray-500 font-medium">Avg. Attendance</p>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
             <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-yellow-200">
                 <HiLightningBolt className="text-xl" />
             </div>
             <p className="text-3xl font-bold text-[#0F172A]">{analytics?.allEvents.length > 0 ? analytics.allEvents[0].mode : 'N/A'}</p>
             <p className="text-sm text-gray-500 font-medium">Latest Mode</p>
         </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Timeline Chart */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <HiChartBar className="text-blue-500" /> Event Activity
              </h2>
              <div className="h-64">
                <Line data={timelineChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { borderDash: [5, 5] }, beginAtZero: true }, x: { grid: { display: false } } } }} />
              </div>
          </div>

          {/* Top Events */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <HiLightningBolt className="text-purple-500" /> Top Performing Events
              </h2>
              <div className="h-64">
                  <Bar data={topEventsChartData} options={{ maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { display: false, beginAtZero: true }, y: { grid: { display: false } } } }} />
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Status Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-[#0F172A] mb-4 text-center">Event Status</h2>
              <div className="h-64 flex justify-center relative">
                   <Doughnut data={statusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } }, cutout: '70%' }} />
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="text-center">
                           <p className="text-3xl font-bold text-[#0F172A]">{analytics?.allEvents.length}</p>
                           <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total</p>
                       </div>
                   </div>
              </div>
          </div>

          {/* Detailed Stats List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-[#0F172A] mb-6">Recent Activity Log</h2>
              <div className="overflow-y-auto max-h-64 space-y-4 pr-2 custom-scrollbar">
                  {analytics?.allEvents.sort((a,b) => new Date(b.startDate) - new Date(a.startDate)).map((event, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-blue-50 transition">
                          <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold
                                  ${event.status === 'Completed' ? 'bg-green-500' : event.status === 'Active' ? 'bg-blue-500' : event.status === 'Cancelled' ? 'bg-red-500' : 'bg-purple-500'}
                              `}>
                                  {event.title.charAt(0)}
                              </div>
                              <div>
                                  <h4 className="font-bold text-[#0F172A]">{event.title}</h4>
                                  <p className="text-xs text-gray-500">{new Date(event.startDate).toLocaleDateString()} • {event.location}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                  ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : event.status === 'Active' ? 'bg-blue-100 text-blue-700' : event.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}
                              `}>
                                  {event.status}
                              </span>
                              <p className="text-xs text-gray-400 mt-1 font-medium">{event.attendees || 0} Attended</p>
                          </div>
                      </div>
                  ))}
                  {analytics?.allEvents.length === 0 && (
                      <p className="text-center text-gray-400 py-8">No events to display</p>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
