'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function SelectRolePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [role, setRole] = useState('attendee');
  const [organization, setOrganization] = useState('');
  const [college, setCollege] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  useEffect(() => {
    // Backward compatibility: redirect to unified onboarding
    if (status === 'authenticated') router.push('/dashboard/onboarding');
  }, [status, session?.user?.needsRoleSetup, session?.user?.needsPasswordSetup, router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!session?.user?.id) {
      setError('Session not found. Please login again.');
      return;
    }
    if (role === 'organizer' && !organization.trim()) {
      setError('Organization is required for organizer role.');
      return;
    }
    if (role === 'attendee' && !college.trim()) {
      setError('College is required for attendee role.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        role,
        isRoleSelected: true,
        ...(role === 'organizer' ? { organization: organization.trim(), college: '' } : {}),
        ...(role === 'attendee' ? { college: college.trim(), organization: '' } : {}),
      };

      const res = await fetch(`/api/user/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update role');

      setSuccess('✅ Role saved!');
      const newSession = await update();
      setTimeout(() => {
        if (newSession?.user?.needsPasswordSetup) router.push('/dashboard/set-password');
        else router.push('/dashboard');
      }, 600);
    } catch (err) {
      setError(err.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen text-white text-xl bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 mr-3"></div>
        Loading...
      </div>
    );
  }
  if (status === 'unauthenticated') return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-blue-300 mb-2">Choose your role</h1>
        <p className="text-sm text-gray-300 mb-6">
          You signed in with Google. Select whether you want to use EventFlow as an attendee or an organizer.
        </p>

        {error && <div className="mb-4 bg-red-600 text-white p-3 rounded-lg text-sm">{error}</div>}
        {success && <div className="mb-4 bg-green-600 text-white p-3 rounded-lg text-sm">{success}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole('attendee')}
              className={`flex-1 py-2 rounded-lg font-semibold border ${
                role === 'attendee' ? 'bg-blue-600 border-blue-500' : 'bg-gray-700 border-gray-600'
              }`}
              disabled={loading}
            >
              Attendee
            </button>
            <button
              type="button"
              onClick={() => setRole('organizer')}
              className={`flex-1 py-2 rounded-lg font-semibold border ${
                role === 'organizer' ? 'bg-blue-600 border-blue-500' : 'bg-gray-700 border-gray-600'
              }`}
              disabled={loading}
            >
              Organizer
            </button>
          </div>

          {role === 'attendee' && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">College</label>
              <input
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your college name"
                disabled={loading}
              />
            </div>
          )}

          {role === 'organizer' && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Organization</label>
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your organization name"
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

