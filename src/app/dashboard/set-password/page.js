'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function SetPasswordPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    // Backward compatibility: redirect to unified onboarding
    if (status === 'authenticated') {
      router.push('/dashboard/onboarding');
      return;
    }

    // If user already has password (or doesn't need setup), bounce to dashboard
    if (status === 'authenticated' && session?.user?.needsPasswordSetup === false) {
      router.push('/dashboard');
    }
  }, [status, session?.user?.needsRoleSetup, session?.user?.needsPasswordSetup, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!session?.user?.id) {
      setError('Session not found. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/user/${session.user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to set password');

      setSuccess('✅ Password set successfully!');
      // Refresh session so needsPasswordSetup becomes false
      const newSession = await update();
      setTimeout(() => {
        if (newSession?.user?.needsRoleSetup) router.push('/dashboard/select-role');
        else router.push('/dashboard');
      }, 400);
    } catch (err) {
      setError(err.message || 'Failed to set password');
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
        <h1 className="text-2xl font-bold text-blue-300 mb-2">Set your password</h1>
        <p className="text-sm text-gray-300 mb-6">
          You signed in with Google. Please set a password so you can also login with email &amp; password later.
        </p>

        {error && <div className="mb-4 bg-red-600 text-white p-3 rounded-lg text-sm">{error}</div>}
        {success && <div className="mb-4 bg-green-600 text-white p-3 rounded-lg text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="At least 6 characters"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Re-enter password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg"
          >
            {loading ? 'Saving...' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

