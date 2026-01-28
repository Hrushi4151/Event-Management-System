'use client'
import React, { useEffect, useState } from 'react'
import Adashboard from './components/attendee/Adashboard'
import Odashboard from './components/organizer/Odashboard'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const page = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    // Check database directly via API instead of relying on session flags
    if (status === 'authenticated' && session?.user?.id) {
      const checkOnboarding = async () => {
        try {
          const res = await fetch(`/api/user/${session.user.id}?verifySetup=true`);
          if (res.ok) {
            const data = await res.json();
            const needsRoleSetup = !data.hasRole;
            const needsPasswordSetup = !data.hasPassword;
            
            if (needsRoleSetup || needsPasswordSetup) {
              router.replace('/dashboard/onboarding');
              return;
            }
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        } finally {
          setCheckingOnboarding(false);
        }
      };
      
      checkOnboarding();
    } else if (status === 'authenticated') {
      setCheckingOnboarding(false);
    }
  }, [status, session?.user?.id, router]);
  
  if (status === 'loading' || checkingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect via useEffect
  }

  const role = session?.user?.role;
  
  return (
    <>
     {role === 'attendee' && <Adashboard />}
     {role === 'organizer' && <Odashboard />}
    </>
  )
}

export default page