'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardInvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const res = await fetch('/api/user/invitations');
        if (!res.ok) {
           if (res.status === 401) {
              window.location.href = '/login';
              return;
           }
           throw new Error('Failed to fetch invitations');
        }
        const data = await res.json();
        setInvitations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pending Invitations</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <p className="text-lg text-gray-500 mb-4">You have no pending invitations.</p>
          <Link href="/dashboard/events" className="text-blue-500 hover:underline">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invitations.map((invite) => (
            <div key={invite.invitationToken} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-800 mb-1">{invite.event.title}</h2>
                  <p className="text-sm text-gray-500">
                      Team: <span className="font-semibold text-gray-700">{invite.teamName || 'N/A'}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                      From: <span className="font-semibold text-gray-700">{invite.leaderName}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                      {new Date(invite.event.startDate).toLocaleDateString()}
                  </p>
              </div>
              
              <Link 
                href={`/dashboard/invitations/${invite.invitationToken}`}
                className="block w-full bg-blue-50 text-blue-600 text-center py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                View & Accept
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
