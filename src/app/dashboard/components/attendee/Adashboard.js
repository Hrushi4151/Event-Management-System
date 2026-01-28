'use client'

import {
  FaCalendarCheck,
  FaTicketAlt,
  FaClock,
  FaCheckCircle,
  FaCommentDots,
} from 'react-icons/fa';
import { HiRefresh } from 'react-icons/hi';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend } from 'chart.js';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function AttendeeDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ticketsBooked: 0,
    eventsAttended: 0,
    upcomingEvents: 0,
    expiredCancelled: 0,
    pendingRegistrations: 0,
  });
  const [participationData, setParticipationData] = useState({
    labels: [],
    datasets: [{
      label: 'Events Registered',
      data: [],
      backgroundColor: '#2563EB',
      borderRadius: 8,
      barThickness: 40,
    }],
  });
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [categoryData, setCategoryData] = useState({
    labels: [],
    datasets: [{
      label: 'Event Types',
      data: [],
      backgroundColor: [
        '#2563EB',
        '#22D3EE',
        '#10B981',
        '#F59E0B',
        '#EF4444',
      ],
      borderWidth: 0,
    }],
  });

  const fetchAttendeeData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/registration/user/${session.user.id}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      
      const registrations = await res.json();
      
      // Calculate stats
      const now = new Date();
      const ticketsBooked = registrations.length;
      
      const upcomingEvents = registrations.filter(reg => {
        const event = reg.event;
        const startDate = new Date(event?.startDate);
        return startDate > now && reg.status === 'Accepted';
      }).length;
      
      const eventsAttended = registrations.filter(reg => {
        const event = reg.event;
        const endDate = new Date(event?.endDate);
        return endDate < now && reg.checkedIn === true;
      }).length;
      
      const expiredCancelled = registrations.filter(reg => {
        const event = reg.event;
        const endDate = new Date(event?.endDate);
        return (endDate < now && !reg.checkedIn) || reg.status === 'Rejected';
      }).length;
      
      const pendingRegistrations = registrations.filter(reg => reg.status === 'Pending').length;

      // Calculate attendance rate
      const acceptedRegistrations = registrations.filter(reg => reg.status === 'Accepted');
      const checkedInCount = acceptedRegistrations.filter(reg => reg.checkedIn).length;
      const attendanceRateValue = acceptedRegistrations.length > 0 
        ? Math.round((checkedInCount / acceptedRegistrations.length) * 100) 
        : 0;

      // Generate participation timeline (last 6 months)
      const months = [];
      const monthData = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push(date.toLocaleDateString('en-US', { month: 'short' }));
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const count = registrations.filter(reg => {
          const regDate = new Date(reg.createdAt);
          return regDate >= monthStart && regDate <= monthEnd && reg.status === 'Accepted';
        }).length;
        
        monthData.push(count);
      }

      setStats({
        ticketsBooked,
        eventsAttended,
        upcomingEvents,
        expiredCancelled,
        pendingRegistrations,
      });

      setParticipationData({
        labels: months,
        datasets: [{
          label: 'Events Registered',
          data: monthData,
          backgroundColor: '#2563EB',
          borderRadius: 8,
          barThickness: 40,
        }],
      });

      setAttendanceRate(attendanceRateValue);

      // Generate category data
      const modeCounts = {};
      registrations.forEach(reg => {
        const mode = reg.event?.mode || 'Unknown';
        modeCounts[mode] = (modeCounts[mode] || 0) + 1;
      });

      const categoryLabels = Object.keys(modeCounts);
      const categoryValues = Object.values(modeCounts);

      setCategoryData({
        labels: categoryLabels.length > 0 ? categoryLabels : ['No Events'],
        datasets: [{
          label: 'Event Types',
          data: categoryValues.length > 0 ? categoryValues : [1],
          backgroundColor: [
            '#2563EB',
            '#22D3EE',
            '#10B981',
            '#F59E0B',
            '#EF4444',
          ],
          borderWidth: 0,
        }],
      });
    } catch (error) {
      console.error('Error fetching attendee data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchAttendeeData();
      const interval = setInterval(fetchAttendeeData, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  const statsArray = [
    {
      label: 'Tickets Booked',
      value: stats.ticketsBooked,
      icon: <FaTicketAlt size={24} />,
      iconBg: 'bg-blue-600',
      iconColor: 'text-blue-600',
      shadow: 'shadow-blue-200',
    },
    {
      label: 'Events Attended',
      value: stats.eventsAttended,
      icon: <FaCheckCircle size={24} />,
      iconBg: 'bg-green-600',
      iconColor: 'text-green-600',
      shadow: 'shadow-green-200',
    },
    {
      label: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: <FaCalendarCheck size={24} />,
      iconBg: 'bg-cyan-500',
      iconColor: 'text-cyan-500',
      shadow: 'shadow-cyan-200',
    },
    {
      label: 'Expired/Cancelled',
      value: stats.expiredCancelled,
      icon: <FaClock size={24} />,
      iconBg: 'bg-gray-500',
      iconColor: 'text-gray-500',
      shadow: 'shadow-gray-200',
    },
    {
      label: 'Pending',
      value: stats.pendingRegistrations,
      icon: <FaCommentDots size={24} />,
      iconBg: 'bg-orange-500',
      iconColor: 'text-orange-500',
      shadow: 'shadow-orange-200',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600"></div>
          <span className="text-lg text-gray-700">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 lg:px-16 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fadeIn">
          <div>
            <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Dashboard</h1>
            <p className="text-[#64748B]">Welcome back, {session?.user?.name}! 👋</p>
          </div>
          <button
            onClick={fetchAttendeeData}
            className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl hover:bg-gray-50 
                     transition-all flex items-center gap-2 text-[#64748B] hover:text-[#0F172A]"
          >
            <HiRefresh className="text-lg" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 animate-fadeIn">
          {statsArray.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 border border-[#E5E7EB] hover:shadow-lg transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} ${stat.shadow} shadow-lg
                            flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <div className={`text-3xl font-bold ${stat.iconColor} mb-1`}>
                {stat.value}
              </div>
              <div className="text-sm font-medium text-[#64748B]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Participation Timeline */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E5E7EB] animate-fadeIn">
            <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
              📈 Event Participation Timeline
            </h2>
            <div className="h-64">
              <Bar 
                data={participationData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        color: '#64748B',
                      },
                      grid: {
                        color: '#F1F5F9',
                      },
                    },
                    x: {
                      ticks: {
                        color: '#64748B',
                      },
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] text-center animate-fadeIn">
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">🎯 Attendance Rate</h2>
            <div className="w-40 h-40 mx-auto my-6">
              <CircularProgressbar
                value={attendanceRate}
                text={`${attendanceRate}%`}
                styles={buildStyles({
                  textColor: '#2563EB',
                  pathColor: '#2563EB',
                  trailColor: '#F1F5F9',
                  textSize: '24px',
                })}
              />
            </div>
            <p className="text-[#64748B] text-sm">
              {attendanceRate > 0 
                ? `You've attended ${attendanceRate}% of registered events`
                : 'No attendance data available yet'}
            </p>
          </div>
        </div>

        {/* Event Category & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Type Distribution */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] animate-fadeIn">
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">🥧 Event Type Distribution</h2>
            <div className="h-64 flex items-center justify-center">
              <div className="w-64 h-64">
                <Doughnut 
                  data={categoryData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#64748B',
                          padding: 15,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] animate-fadeIn">
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">⚡ Quick Actions</h2>
            <div className="space-y-3">
              <a 
                href="/dashboard/events" 
                className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 
                         text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                <FaCalendarCheck className="text-xl" />
                Browse Events
              </a>
              <a 
                href="/dashboard/tickets" 
                className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-[#E5E7EB] 
                         text-[#0F172A] rounded-xl hover:border-blue-600 hover:text-blue-600 
                         transition-all duration-300 font-medium"
              >
                <FaTicketAlt className="text-xl" />
                My Tickets
              </a>
              <a 
                href="/dashboard/profile" 
                className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-[#E5E7EB] 
                         text-[#0F172A] rounded-xl hover:border-blue-600 hover:text-blue-600 
                         transition-all duration-300 font-medium"
              >
                <FaCheckCircle className="text-xl" />
                View Profile
              </a>
            </div>

            {stats.pendingRegistrations > 0 && (
              <div className="mt-6 bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-orange-700 font-semibold mb-1">
                  <FaCommentDots />
                  Pending Registrations
                </div>
                <p className="text-sm text-orange-600">
                  You have {stats.pendingRegistrations} registration{stats.pendingRegistrations > 1 ? 's' : ''} awaiting approval
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
