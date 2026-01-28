// src/app/ReduxReducers/StoreProvider.js
'use client';

import { SessionProvider } from 'next-auth/react';
import { OrganizerProvider } from '../components/ContextProvider';

export default function StoreProvider({ children }) {

  return <SessionProvider>
    <OrganizerProvider>{children}</OrganizerProvider>
  </SessionProvider>;
}
