'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [role, setRole] = useState('attendee');
  const [organization, setOrganization] = useState('');
  const [college, setCollege] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    // Check DB directly to see if onboarding is already completed
    // Only check if not currently submitting
    if (!isSubmitting && !hasCompleted && status === 'authenticated' && session?.user?.id) {
      const checkCompletion = async () => {
        try {
          const res = await fetch(`/api/user/${session.user.id}?verifySetup=true`);
          if (res.ok) {
            const data = await res.json();
            // If both are set, onboarding is complete - redirect to dashboard
            if (data.hasRole && data.hasPassword) {
              setHasCompleted(true);
              router.replace('/dashboard');
            }
          }
        } catch (error) {
          console.error('Error checking onboarding completion:', error);
        }
      };
      checkCompletion();
    }
  }, [status, session?.user?.id, router, isSubmitting, hasCompleted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (role === 'organizer' && !organization.trim()) {
      setError('Organization is required for organizer role.');
      return;
    }
    if (role === 'attendee' && !college.trim()) {
      setError('College is required for attendee role.');
      return;
    }

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
    setIsSubmitting(true);
    setHasCompleted(false);
    
    try {
      // Single API call to update both role and password - trust the API
      const payload = {
        role,
        password: newPassword,
        ...(role === 'organizer' 
          ? { organization: organization.trim(), college: '' }
          : { college: college.trim(), organization: '' }
        ),
      };

      const res = await fetch(`/api/user/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to complete setup');
      }

      // Trust the API - if it succeeded, data is saved
      setSuccess('✅ Setup completed successfully! Redirecting...');
      setHasCompleted(true);

      // Wait a moment for DB to commit, then redirect
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force hard redirect with full page reload - dashboard will check DB and won't redirect back
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Something went wrong');
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

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-blue-300 mb-2">Complete Your Setup</h1>
        <p className="text-sm text-gray-300 mb-6">
          Please select your role and set a password to continue.
        </p>

        {error && (
          <div className="mb-4 bg-red-600 text-white p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-600 text-white p-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Select your role</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setRole('attendee');
                  setOrganization('');
                }}
                className={`flex-1 py-2 rounded-lg font-semibold border transition-colors ${
                  role === 'attendee'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
                disabled={loading}
              >
                Attendee
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('organizer');
                  setCollege('');
                }}
                className={`flex-1 py-2 rounded-lg font-semibold border transition-colors ${
                  role === 'organizer'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
                disabled={loading}
              >
                Organizer
              </button>
            </div>
          </div>

          {/* College/Organization Field */}
          {role === 'attendee' ? (
            <div>
              <label className="block text-sm text-gray-300 mb-1">College Name</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your college name"
                disabled={loading}
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Organization Name</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your organization name"
                disabled={loading}
                required
              />
            </div>
          )}

          {/* Password Fields */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="At least 6 characters"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Re-enter your password"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
