'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No invitation token provided.');
      return;
    }

    const acceptInvite = async () => {
      try {
        const res = await fetch('/api/registration/accept-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const result = await res.json();

        if (res.ok) {
          setStatus('success');
          setData(result);
        } else {
          setStatus('error');
          setMessage(result.error || 'Failed to accept invitation.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error occurred.');
      }
    };

    acceptInvite();
  }, [token]);

  return (
    <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md flex flex-col items-center gap-6 text-center">
      {status === 'verifying' && (
        <>
           <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
           <h2 className="text-xl font-bold text-gray-700">Verifying Invitation...</h2>
        </>
      )}

      {status === 'success' && (
        <>
           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
             <span className="text-3xl">🎉</span>
           </div>
           <h1 className="text-2xl font-bold text-[#6EA1B6]">Invitation Accepted!</h1>
           <p className="text-gray-600">
             You have successfully joined <strong>{data?.teamName}</strong> for <strong>{data?.eventTitle}</strong>.
           </p>
           <div className="flex flex-col gap-3 w-full mt-4">
             <Link href="/login" className="bg-[#6EA1B6] text-white rounded-full px-6 py-2 font-semibold hover:opacity-90 transition-all">
               Login to Dashboard
             </Link>
             <Link href="/" className="text-gray-500 hover:underline">
               Go Home
             </Link>
           </div>
        </>
      )}

      {status === 'error' && (
        <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
             <span className="text-3xl">⚠️</span>
           </div>
           <h1 className="text-2xl font-bold text-red-500">Invitation Failed</h1>
           <p className="text-gray-600">{message}</p>
           <Link href="/" className="mt-4 text-blue-500 hover:underline">
             Return Home
           </Link>
        </>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
    return (
        <div className="min-h-screen bg-[#eaf2fb] flex items-center justify-center font-sans p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <AcceptInviteContent />
            </Suspense>
        </div>
    );
}
