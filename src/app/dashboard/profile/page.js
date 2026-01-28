'use client'
import React, { useEffect } from 'react'
import Oprofile from '../components/organizer/Oprofile'
import Aprofile from '../components/attendee/Aprofile'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const page = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen text-white text-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 mr-3"></div>
        Loading...
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return null; // Will redirect via useEffect
  }
  
  const role = session?.user?.role;
  
  return (
    <>
     {role === 'attendee' && <Aprofile />}
     {role === 'organizer' && <Oprofile />}
    </>
  )
}

export default page