'use client'
import React from 'react'
import AttendeeSidebar from './attendee/AttendeeSidebar'
import OrganizerSidebar from './organizer/OrganizerSidebar'
import { useSession } from 'next-auth/react'

const Navbar = () => {
  const session=useSession();
  
  let role=session?.data?.user?.role;
  return (
    <>
     {role === 'attendee' && <AttendeeSidebar />}
     {role === 'organizer' && <OrganizerSidebar />}
    </>
  )
}

export default Navbar