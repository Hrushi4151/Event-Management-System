'use client'
import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const Wrapper = ({children}) => {
    const session=useSession();

    const router=useRouter();

    if(session.data!=null){
        router.push("/dashboard");
    }
    
  return (

    <div>{children}</div>
  )
}

export default Wrapper