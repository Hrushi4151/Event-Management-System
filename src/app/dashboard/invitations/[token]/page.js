'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Component to handle the logic, wrapped in Suspense
function AcceptInviteContent({ token }) {
  const router = useRouter();

  const [status, setStatus] = useState('verifying'); // verifying, success, error, ready
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');

  const acceptInvite = async () => {
    try {
      setStatus('verifying');
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

  useEffect(() => {
     // Check if token exists, then show "Ready" state
     if (token) {
        setStatus('ready');
     } else {
        setStatus('error');
        setMessage('Invalid invitation link.');
     }
  }, [token]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 w-full max-w-md flex flex-col items-center gap-6 text-center mx-auto mt-10">
      {status === 'ready' && (
        <>
           <h1 className="text-2xl font-bold text-gray-800">You&apos;re Invited!</h1>
           <p className="text-gray-600">
             To access this event, please confirm your team membership.
           </p>
           <button 
             onClick={acceptInvite}
             className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105"
           >
             Accept Invitation
           </button>
        </>
      )}

      {status === 'verifying' && (
        <>
           <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
           <h2 className="text-xl font-bold text-gray-700">Processing...</h2>
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
             <Link href="/dashboard" className="bg-[#6EA1B6] text-white rounded-full px-6 py-2 font-semibold hover:opacity-90 transition-all">
               Go to Dashboard
             </Link>
           </div>
        </>
      )}

      {status === 'error' && (
        <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
             <span className="text-3xl">⚠️</span>
           </div>
           <h1 className="text-2xl font-bold text-red-500">Error</h1>
           <p className="text-gray-600">{message}</p>
           <Link href="/dashboard/invitations" className="mt-4 text-blue-500 hover:underline">
             Back to Invitations
           </Link>
        </>
      )}
    </div>
  );
}

export default function InvitationDetailPage({ params }) {
    // Unwrapping params for Next.js 15+ or just accessing them
    // In client components, using useParams() is safer if params prop behavior varies
    // But since we are passing it to content, let's try to read it.
    // Actually, let's just use `useParams` from next/navigation inside the component to be perfectly safe.
    
    // Wrapper component to provide the params
    return (
        <div className="p-6">
             <InvitationWrapper /> 
        </div>
    );
}

import { useParams } from 'next/navigation';

function InvitationWrapper() {
    const params = useParams();
    const token = params?.token;
    
    return <AcceptInviteContent token={token} />;
}
