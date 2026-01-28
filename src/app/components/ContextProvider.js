// context/OrganizerContext.js
"use client";
import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const OrganizerContext = createContext();

export const OrganizerProvider = ({ children }) => {
  const { data: session } = useSession();
  const [organizerData, setOrganizerData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganizerStats = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/getallorganizerstat/${session.user.id}`);
      if (!res.ok) throw new Error("Failed to fetch organizer stats");

      const data = await res.json();
      setOrganizerData(data);
      
    } catch (err) {
      console.error("Error fetching organizer stats:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchOrganizerStats();
  }, [fetchOrganizerStats]);

  return (
    <OrganizerContext.Provider
      value={{
        organizerData,
        loading,
        refreshOrganizerData: fetchOrganizerStats, // expose refresh function
      }}
    >
      {children}
    </OrganizerContext.Provider>
  );
};

export const useOrganizer = () => useContext(OrganizerContext);
