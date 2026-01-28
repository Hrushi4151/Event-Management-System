'use client';

import { useState, useEffect } from 'react';
import {
  HiUserGroup,
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiPencilAlt,
  HiX,
  HiMail,
  HiTicket,
  HiUsers,
  HiCalendar,
  HiDownload,
  HiLocationMarker,
  HiCurrencyDollar
} from 'react-icons/hi';
import { QRCodeSVG } from 'qrcode.react';
import AttendedPage from './Attended';
import CompletedEventFeatures from './CompletedEventFeatures';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('../MapPicker'), { ssr: false });

const tabs = [
  { label: 'Total', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <HiUserGroup className="text-blue-500" /> },
  { label: 'Accepted', color: 'bg-green-50 text-green-700 border-green-200', icon: <HiCheckCircle className="text-green-500" /> },
  { label: 'Pending', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <HiClock className="text-yellow-500" /> },
  { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', icon: <HiXCircle className="text-red-500" /> },
  { label: 'Attendees', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <HiUserGroup className="text-orange-500" /> },
];

export default function page() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Total');
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [data, setData] = useState(null);

  // 🔹 Loading and action states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Location search state
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Debounce location search
  useEffect(() => {
    if (locationSearch.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingLocation(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=5`
        );
        const data = await response.json();
        setLocationSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Location search error:', error);
      } finally {
        setSearchingLocation(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationSearch]);

  const handleLocationSelect = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    setData(prev => ({
      ...prev,
      location: suggestion.display_name,
      coordinates: { lat, lng }
    }));
    
    setLocationSearch('');
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        setData(prev => ({
          ...prev,
          location: data.display_name
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setData(prev => ({
            ...prev,
            coordinates: { lat: latitude, lng: longitude }
          }));
          await reverseGeocode(latitude, longitude);
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/eventstats/${id}`);
      const json = await res.json();
     if(json.status==200){
       setData(json.result);
    }else{
      console.log(json);
     }
      
    } catch (err) {
      console.log("Error fetching event stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStats();
    }
  }, [id]);

  // Convert file to base64
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handlePosterChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await toBase64(file);
      setData((prevData) => ({
        ...prevData,
        poster: base64,
      }));
    }
  };

  const handleChange = (field, value) => {
    setData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  // 🔹 Event Update
  const updateEvent = async () => {
    // Validation
    if(data.status === 'Cancelled') {
        alert("Cannot update a cancelled event.");
        return;
    }
    
    const errors = [];
    if (!data.eventName?.trim()) errors.push("Event title is required");
    if (!data.location?.trim()) errors.push("Location is required");
    if (new Date(data.startDate) > new Date(data.endDate)) errors.push("End date cannot be before start date");
    if (data.registrationStartDate && data.registrationEndDate) {
        if (new Date(data.registrationStartDate) > new Date(data.registrationEndDate)) errors.push("Registration end date cannot be before start date");
        if (new Date(data.registrationEndDate) > new Date(data.endDate)) errors.push("Registration cannot end after event ends");
    }
    if (!data.isFree && Number(data.registrationFee) < 0) errors.push("Fee cannot be negative");

    if (errors.length > 0) {
        alert("⚠️ Validation Error:\n" + errors.join("\n"));
        return;
    }

    try {
      setActionLoading(true);
      const payload = {
        title: data.eventName,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        registrationStartDate: data.registrationStartDate,
        registrationEndDate: data.registrationEndDate,
        actualEventDate: data.actualEventDate,
        description: data.eventDesc,
        bannerImage: data.poster,
        isFree: data.isFree === true || data.isFree === 'true',
        registrationFee: Number(data.registrationFee || 0),
        currency: data.currency,
        coordinates: data.coordinates,
      };

      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update event");
      await res.json();

      await fetchStats(); // refresh UI
      alert("✅ Event updated successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update event");
    } finally {
      setActionLoading(false);
    }
  };

  // 🔹 Event Cancel (Soft Delete)
  const deleteEvent = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to cancel event");
      }

      alert("🚫 Event cancelled successfully! It will be moved to the Cancelled Events section.");
      // Redirect to events page after cancellation
      router.push("/dashboard/events");
    } catch (err) {
      console.error(err);
      alert(`❌ Failed to cancel event: ${err.message}`);
    } finally {
      setActionLoading(false);
      setShowCancelModal(false);
    }
  };

  const teams = data?.teams || [];
  const filteredData =
    data
      ? activeTab === 'Total'
        ? teams
        : teams.filter((reg) => reg.status === activeTab)
      : [];

  const handleStatusChange = async (registrationId, newStatus) => {
    try {
      setActionLoading(true);
      
      const res = await fetch(`/api/registration/${registrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update registration status');
      }

      // Refresh event stats after update
      await fetchStats();
      setActiveTab('Total');
      setSelectedAttendee(null);
      
      alert(`✅ Registration ${newStatus.toLowerCase()} successfully!`);
    } catch (err) {
      console.error('Status update error:', err);
      alert(`❌ Failed to update status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 🔹 Show loader while fetching
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E5E7EB] border-t-[#2563EB]"></div>
          <span className="text-[#0F172A] text-lg font-medium">Loading event details...</span>
        </div>
      </div>
    );
  }

  // 🔹 Error/No Data state
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] text-[#64748B] text-lg">
        ❌ Failed to load event details.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-8 relative font-sans text-[#0F172A]">
      {/* 🔹 Action Loading Overlay */}
      {actionLoading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-[100]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mb-3"></div>
          <p className="text-[#0F172A] font-semibold text-lg">Processing...</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">Event Manager</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                    data.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                    data.status === 'Completed' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                    data.status === 'Active' ? 'bg-green-50 text-green-600 border-green-200' :
                    'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                    {data.status || 'Upcoming'}
                </span>
             </div>
             <h1 className="text-3xl font-bold text-[#0F172A] flex items-center gap-2">
                📅 {data.eventName}
             </h1>
             <p className="text-[#64748B] mt-1">Update details, manage attendees, and track analytics</p>
          </div>
          
        </div>

        {/* Event Edit Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-[#E5E7EB] space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
                <div className="p-3 bg-blue-50 rounded-xl">
                <HiPencilAlt className="text-[#2563EB] text-xl" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Edit Event Details</h2>
                    <p className="text-sm text-[#64748B]">Update essential information and configuration</p>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* ================= LEFT COLUMN (Poster & Map) ================= */}
            <div className="lg:col-span-4 space-y-6">

                {/* Poster Card */}
                <div className="bg-gray-50/80 rounded-2xl p-6 border border-blue-200 transition-colors space-y-3">
                    <label className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                        🖼️ Event Poster
                    </label>
                    <div className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-white hover:border-blue-400 transition-colors">
                        <img
                            src={data && data.poster}
                            alt="Event Poster"
                            className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer bg-white text-[#0F172A] px-4 py-2 rounded-lg font-medium shadow-sm hover:scale-105 transition-transform">
                                Change Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePosterChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Location + Map Card */}
                <div className="bg-gray-50/80 rounded-2xl p-6 border border-blue-200 transition-colors space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                             <span className="p-1.5 bg-red-100 text-red-600 rounded-lg"><HiLocationMarker className="text-sm" /></span>
                             Location & Map
                        </label>
                        <button
                            type="button"
                            onClick={getUserLocation}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                        >
                            📍 Find Me
                        </button>
                    </div>

                    {/* Location Search Row */}
                    <div className="relative">
                        <input
                            type="text"
                            value={data?.location || ''}
                            placeholder="Search address..."
                            autoComplete="off"
                            onChange={(e) => {
                            handleChange("location", e.target.value);
                            setLocationSearch(e.target.value);
                            }}
                            onFocus={() => locationSuggestions.length && setShowSuggestions(true)}
                            className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 pl-10 text-[#0F172A] placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] outline-none transition-all shadow-sm h-11 text-sm font-medium"
                        />
                        <HiLocationMarker className="absolute left-3 top-3.5 text-gray-400" />

                        {searchingLocation && (
                            <div className="absolute right-3 top-3.5 animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                        )}

                        {showSuggestions && locationSuggestions.length > 0 && (
                            <div className="absolute z-50 w-full bg-white border border-[#E5E7EB] rounded-xl mt-2 shadow-xl max-h-48 overflow-y-auto">
                            {locationSuggestions.map((s, i) => (
                                <div
                                key={i}
                                onClick={() => handleLocationSelect(s)}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-xs font-medium border-b border-gray-100 last:border-0 text-[#0F172A]"
                                >
                                {s.display_name}
                                </div>
                            ))}
                            </div>
                        )}
                    </div>

                    {/* Map Display */}
                    <div className="h-48 rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm relative group bg-white">
                        <MapPicker
                            initialPosition={data?.coordinates || { lat: 20.5937, lng: 78.9629 }}
                            onLocationSelect={(pos) => {
                                handleChange("coordinates", pos);
                                reverseGeocode(pos.lat, pos.lng);
                            }}
                        />
                    </div>
                    
                    {/* Get Directions Link */}
                    <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data?.location || `${data?.coordinates?.lat},${data?.coordinates?.lng}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 bg-white text-gray-600 rounded-xl border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all text-xs font-bold"
                    >
                        🗺️ Google Maps Directions
                    </a>
                </div>
            </div>

            {/* ================= RIGHT COLUMN (Forms) ================= */}
            <div className="lg:col-span-8 space-y-6">
                 
                 {/* Basic Info */}
                 <div className="bg-gray-50/80 rounded-2xl p-6 border border-blue-200 transition-colors">
                    <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2 text-lg">
                        <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><HiPencilAlt /></span> 
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Event Title</label>
                            <input
                                type="text"
                                value={data?.eventName || ''}
                                onChange={(e) => handleChange("eventName", e.target.value)}
                                className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-[#0F172A] font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] outline-none transition-all shadow-sm"
                                placeholder="e.g. Annual Tech Conference 2024"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Description</label>
                            <textarea
                                rows={4}
                                value={data?.eventDesc || ''}
                                onChange={(e) => handleChange("eventDesc", e.target.value)}
                                className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-[#0F172A] focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] outline-none transition-all resize-none shadow-sm"
                                placeholder="Describe your event..."
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dates */}
                    <div className="bg-gray-50/80 rounded-2xl p-6 border border-blue-200 transition-colors space-y-4">
                        <h3 className="font-bold text-[#0F172A] border-b border-gray-200 pb-3 flex items-center gap-2">
                             <span className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><HiCalendar /></span>
                             Event Schedule
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1 block">Start</label>
                                    <input type="date" value={data?.startDate} onChange={(e) => handleChange("startDate", e.target.value)} 
                                    className="w-full rounded-lg bg-white border border-[#E5E7EB] p-2 text-[#0F172A] text-sm focus:border-[#2563EB] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1 block">End</label>
                                    <input type="date" value={data?.endDate} onChange={(e) => handleChange("endDate", e.target.value)} 
                                    className="w-full rounded-lg bg-white border border-[#E5E7EB] p-2 text-[#0F172A] text-sm focus:border-[#2563EB] outline-none transition-all" />
                                </div>
                            </div>
                            <div>
                                 <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1 block">Main Event Date</label>
                                <input
                                type="date"
                                value={data?.actualEventDate || ''}
                                onChange={(e) => handleChange("actualEventDate", e.target.value)}
                                className="w-full rounded-lg bg-white border border-[#E5E7EB] p-2 text-[#0F172A] text-sm focus:border-[#2563EB] outline-none transition-all font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                     {/* Registration */}
                     <div className="bg-gray-50/80 rounded-2xl p-6 border border-blue-200 transition-colors space-y-4">
                        <h3 className="font-bold text-[#0F172A] border-b border-gray-200 pb-3 flex items-center gap-2">
                             <span className="p-1.5 bg-green-100 text-green-600 rounded-lg"><HiTicket /></span>
                             Registration
                        </h3>
                         <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1 block">Opens</label>
                                <input type="date" value={data?.registrationStartDate || ''} onChange={(e) => handleChange("registrationStartDate", e.target.value)} 
                                className="w-full rounded-lg bg-white border border-[#E5E7EB] p-2 text-[#0F172A] text-sm focus:border-[#2563EB] outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1 block">Closes</label>
                                <input type="date" value={data?.registrationEndDate || ''} onChange={(e) => handleChange("registrationEndDate", e.target.value)} 
                                className="w-full rounded-lg bg-white border border-[#E5E7EB] p-2 text-[#0F172A] text-sm focus:border-[#2563EB] outline-none transition-all" />
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 italic">
                            * Set the window during which attendees can register.
                        </div>
                     </div>
                </div>

                {/* Fee */}
                <div className="bg-gray-50/80 rounded-2xl p-6 border border-blue-200 transition-colors">
                    <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                         <span className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg"><HiCurrencyDollar /></span>
                         Pricing & Fee
                    </h3>
                    <div className="flex flex-wrap gap-4 mb-4">
                        <label className={`flex-1 flex gap-3 items-center cursor-pointer p-3 rounded-xl border-2 transition-all ${data?.isFree !== false ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${data?.isFree !== false ? 'border-blue-500' : 'border-gray-300'}`}>
                                {data?.isFree !== false && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                            </div>
                            <input type="radio" checked={data?.isFree !== false} onChange={() => {
                                handleChange("isFree", true);
                                handleChange("registrationFee", 0);
                            }} className="hidden" />
                            <div>
                                <span className="font-bold text-[#0F172A] block text-sm">Free Event</span>
                                <span className="text-xs text-gray-500">No payment required</span>
                            </div>
                        </label>

                        <label className={`flex-1 flex gap-3 items-center cursor-pointer p-3 rounded-xl border-2 transition-all ${data?.isFree === false ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${data?.isFree === false ? 'border-blue-500' : 'border-gray-300'}`}>
                                {data?.isFree === false && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                            </div>
                            <input type="radio" checked={data?.isFree === false} onChange={() => handleChange("isFree", false)} className="hidden" />
                            <div>
                                <span className="font-bold text-[#0F172A] block text-sm">Paid Event</span>
                                <span className="text-xs text-gray-500">Ticket purchase required</span>
                            </div>
                        </label>
                    </div>

                    {data?.isFree === false && (
                    <div className="grid grid-cols-3 gap-4 animate-fadeIn">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1 block">Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">
                                    {data.currency === 'INR' ? '₹' : data.currency === 'USD' ? '$' : '€'}
                                </span>
                                <input
                                type="number"
                                min="1"
                                value={data?.registrationFee || 0}
                                onChange={(e) => handleChange("registrationFee", Number(e.target.value))}
                                className="w-full rounded-xl bg-white border border-[#E5E7EB] p-2.5 pl-8 text-[#0F172A] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                                />
                            </div>
                        </div>
                        <div>
                         <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1 block">Currency</label>
                            <select
                                value={data?.currency || 'INR'}
                                onChange={(e) => handleChange("currency", e.target.value)}
                                className="w-full rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-[#0F172A] outline-none font-medium cursor-pointer"
                            >
                                <option value="INR">₹ INR</option>
                                <option value="USD">$ USD</option>
                                <option value="EUR">€ EUR</option>
                            </select>
                        </div>
                    </div>
                    )}
                </div>

            <div className="flex gap-3">
             <button
               onClick={updateEvent}
               disabled={data.status === 'Cancelled'}
               className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
             >
               <HiCheckCircle className="text-xl" /> Save Changes
             </button>
             <button
               onClick={() => setShowCancelModal(true)}
               disabled={data.status === 'Cancelled'}
               className="px-6 py-2.5 bg-white text-red-600 border border-current rounded-xl hover:bg-red-50 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <HiXCircle className="text-xl" /> Cancel Event
             </button>
          </div>
            </div>
            </div>
        </div>

        {/* Completed Event Features Section */}
        {data && data.endDate && new Date(data.endDate) < new Date() && (
            <CompletedEventFeatures 
            eventId={id}
            eventData={data}
            onUpdate={fetchStats}
            actionLoading={actionLoading}
            setActionLoading={setActionLoading}
            />
        )}

        {/* Registrations Management Section */}
        <div className="space-y-6 pt-10 border-t border-gray-100">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#0F172A] flex items-center gap-2">
                        <span className="p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-500/30"><HiUsers /></span>
                        Manage Registrations
                    </h2>
                    <p className="text-[#64748B] mt-1 ml-11">Review, accept, and track all event participants</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200 w-fit">
                {tabs.map((tab) => {
                    const count = tab.label === 'Total'
                        ? data?.teams?.length ?? 0
                        : tab.label === 'Attendees'
                        ? data?.checkedInAttendees ?? 0
                        : data?.teams?.filter((r) => r.status === tab.label).length ?? 0;
                    
                    const isActive = activeTab === tab.label;
                    
                    return (
                        <button
                            key={tab.label}
                            onClick={() => setActiveTab(tab.label)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                                isActive 
                                    ? 'bg-white text-[#2563EB] shadow-sm ring-1 ring-black/5' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${
                                isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Table / Attendee Page */}
        {activeTab === 'Attendees' ? (
            <AttendedPage registrations={data.teams} onRefresh={fetchStats} />
        ) : (
            <div className="bg-white rounded-3xl border border-blue-200 shadow-xl shadow-blue-500/5 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-10 rounded-full ${
                             activeTab === 'Total' ? 'bg-blue-500' :
                             activeTab === 'Accepted' ? 'bg-green-500' :
                             activeTab === 'Pending' ? 'bg-yellow-500' :
                             'bg-red-500'
                        }`}></div>
                        <div>
                            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">{activeTab} Registrations</h2>
                            <p className="text-xs text-[#64748B] font-medium uppercase tracking-widest mt-0.5">List of all {activeTab.toLowerCase()} entries</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            let csv = 'Team Name,Leader Name,Leader Email,Status,Check-In Status,Total Members,Registration Date\n';
                            filteredData.forEach(reg => {
                            const totalMembers = 1 + (reg.teamMembers?.length || 0);
                            const row = [
                                `"${(reg.teamName || 'Individual').replace(/"/g, '""')}"`,
                                `"${(reg.name || reg.leader?.name || 'N/A').replace(/"/g, '""')}"`,
                                `"${(reg.email || reg.leader?.email || 'N/A').replace(/"/g, '""')}"`,
                                reg.status || 'Pending',
                                reg.checkedIn ? 'Checked In' : 'Not Checked In',
                                totalMembers,
                                reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : '',
                            ].join(',');
                            csv += row + '\n';
                            });
                            
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            const url = URL.createObjectURL(blob);
                            link.setAttribute('href', url);
                            link.setAttribute('download', `${activeTab}_registrations_${data?.eventName?.replace(/\s+/g, '_') || 'event'}_${new Date().toISOString().split('T')[0]}.csv`);
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="bg-white border border-[#E5E7EB] text-[#2563EB] hover:bg-blue-50 px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-sm"
                    >
                        <HiDownload className="text-xl" /> Export to CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#F8FAFC] border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em]">Participant / Team</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em]">Contact Influence</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em]">Registration Status</th>
                                {activeTab === 'Pending' && <th className="px-8 py-5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] text-center">Decision</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredData.map((user) => (
                                <tr
                                key={user.id || user.registrationId}
                                onClick={() => setSelectedAttendee(user)}
                                className="odd:bg-white even:bg-blue-50/20 hover:bg-blue-100/40 transition-all cursor-pointer group border-l-4 border-transparent hover:border-blue-500"
                                >
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shadow-inner group-hover:scale-110 transition-transform">
                                            {(user.teamName || user.name || user.leader?.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#0F172A] text-sm group-hover:text-blue-700 transition-colors">
                                                {user.teamName || <span className="text-gray-400 italic font-medium">Individual Participant</span>}
                                            </p>
                                            <p className="text-[11px] text-[#64748B] font-medium flex items-center gap-1 mt-0.5">
                                                <HiUsers className="text-blue-400" /> {1 + (user.teamMembers?.length || 0)} Members
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="text-sm font-bold text-[#334155]">{user.name || user.leader?.name || 'N/A'}</p>
                                    <p className="text-xs text-[#64748B] mt-0.5 italic">{user.email || user.leader?.email || 'N/A'}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <span
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border-2 ${
                                        user.status === 'Accepted'
                                        ? 'bg-green-50 text-green-700 border-green-100'
                                        : user.status === 'Pending'
                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                    >
                                    {user.status}
                                    </span>
                                </td>
                                {activeTab === 'Pending' && (
                                    <td className="px-8 py-5" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(user.registrationId || user.id, 'Accepted');
                                                }}
                                                disabled={actionLoading}
                                                className="h-9 px-4 bg-green-600 text-white hover:bg-green-700 text-xs font-bold rounded-lg shadow-lg shadow-green-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(user.registrationId || user.id, 'Rejected');
                                                }}
                                                disabled={actionLoading}
                                                className="h-9 px-4 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                )}
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-gray-400 bg-gray-50/30">
                                    <div className="flex flex-col items-center">
                                         <div className="w-16 h-16 bg-white border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center mb-4">
                                            <HiUserGroup className="text-3xl text-gray-200" />
                                         </div>
                                         <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No entries found</p>
                                         <p className="text-xs text-gray-400 mt-1">Try switching the filter or check back later</p>
                                    </div>
                                </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        ) }
      </div>

      {/* Team Details Modal */}
      {selectedAttendee && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-white/20">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-[#0F172A] flex items-center gap-2 tracking-tight">
                  <span className="p-2 bg-blue-100 text-blue-600 rounded-xl"><HiUserGroup /></span>
                  {selectedAttendee.teamName || 'Individual Details'}
                </h2>
                <p className="text-[#64748B] text-sm mt-1 font-medium italic">Comprehensive view of attendee information</p>
              </div>
              <button
                onClick={() => setSelectedAttendee(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-all shadow-sm"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              {/* Team Dashboard Cards */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-600 p-5 rounded-3xl text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
                    <HiUsers className="absolute -right-4 -bottom-4 text-7xl text-white/10 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-70">Team Size</span>
                    <p className="text-3xl font-black mt-1">
                      {1 + (selectedAttendee.teamMembers?.length || 0)} <span className="text-lg font-medium opacity-80">Participants</span>
                    </p>
                  </div>
                  <div className={`p-5 rounded-3xl border-2 shadow-sm flex flex-col justify-between ${
                      selectedAttendee.status === 'Accepted' ? 'bg-green-50 border-green-100 text-green-700' :
                      selectedAttendee.status === 'Pending' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                      'bg-red-50 border-red-100 text-red-700'
                  }`}>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-70">Current Status</span>
                    <p className="text-2xl font-black mt-1 uppercase italic tracking-tighter">{selectedAttendee.status}</p>
                  </div>
              </div>

              {/* Status & QR Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <div className="space-y-4">
                     <div>
                        <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1 block">Check-In Progress</span>
                        <div className={`flex items-center gap-2 font-bold ${selectedAttendee.checkedIn ? 'text-green-600' : 'text-gray-400'}`}>
                           {selectedAttendee.checkedIn ? (
                             <><HiCheckCircle className="text-xl" /> Arrived & Verified</>
                           ) : (
                             <><HiClock className="text-xl" /> Awaiting Arrival</>
                           )}
                        </div>
                     </div>
                     <div>
                        <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1 block">Team Leader</span>
                        <p className="text-[#0F172A] font-bold text-base leading-tight">
                            {selectedAttendee.name || selectedAttendee.leader?.name}
                        </p>
                        <p className="text-xs text-[#64748B] italic mt-0.5">{selectedAttendee.email || selectedAttendee.leader?.email}</p>
                     </div>
                  </div>

                  {selectedAttendee.qrCode && (
                    <div className="bg-white p-4 rounded-2xl border border-blue-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-1.5 bg-gray-50 rounded-xl flex-shrink-0">
                        <QRCodeSVG
                          value={selectedAttendee.qrCode}
                          size={70}
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                      <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-widest font-black text-blue-400 block">Digital ID</span>
                          <p className="font-mono text-[10px] text-gray-500 break-all leading-tight">{selectedAttendee.qrCode}</p>
                      </div>
                    </div>
                  )}
              </div>

              {/* Members List Section */}
               <div className="space-y-5">
                   <div className="flex items-center justify-between">
                       <h3 className="font-black text-[#0F172A] flex items-center gap-2 text-sm uppercase tracking-widest">
                           <HiUsers className="text-blue-500" /> Member Roster
                       </h3>
                       <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{1 + (selectedAttendee.teamMembers?.length || 0)} Total</span>
                   </div>
                   
                   <div className="space-y-3">
                       {/* Leader Card */}
                        <div className="p-4 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-between shadow-sm">
                             <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                                     L
                                 </div>
                                 <div>
                                     <p className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
                                         {selectedAttendee.name || selectedAttendee.leader?.name}
                                         <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase font-black">Admin</span>
                                     </p>
                                     <p className="text-[11px] text-[#64748B] italic font-medium">{selectedAttendee.email || selectedAttendee.leader?.email}</p>
                                 </div>
                             </div>
                             <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedAttendee.checkedIn ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                 {selectedAttendee.checkedIn ? 'Present' : 'Absent'}
                             </div>
                        </div>

                        {/* Members Mapping */}
                        {selectedAttendee.teamMembers?.map((member, idx) => (
                          <div key={idx} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all group">
                             <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-black text-xs group-hover:bg-blue-50 group-hover:text-blue-400 transition-colors">
                                     {idx + 1}
                                 </div>
                                 <div className="space-y-0.5">
                                     <p className="font-bold text-[#0F172A] text-sm">{member.name}</p>
                                     <p className="text-[11px] text-[#64748B] italic font-medium">{member.email}</p>
                                      {member.profile && (
                                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest border border-blue-100/30 bg-blue-50/30 px-1.5 py-0.5 rounded w-fit mt-1">
                                            {member.profile}
                                        </p>
                                      )}
                                 </div>
                             </div>
                             <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${member.attended ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                 {member.attended ? 'Present' : 'Absent'}
                             </div>
                          </div>
                        ))}
                   </div>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-gray-100 flex justify-end bg-gray-50/80">
              <button
                onClick={() => setSelectedAttendee(null)}
                className="px-8 py-3 bg-[#0F172A] text-white hover:bg-blue-600 text-sm font-black rounded-2xl transition-all shadow-lg active:scale-95"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Event Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl border border-red-100 animate-scaleIn">
            <div className="text-center">
                 <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <HiXCircle className="text-3xl text-red-500" />
                 </div>
                 <h2 className="text-2xl font-bold text-[#0F172A]">Cancel Event?</h2>
                 <p className="text-[#64748B] text-sm mt-2">This action cannot be undone. The event will be moved to cancelled status.</p>
            </div>

            <div>
                 <label className="text-sm font-bold text-[#0F172A] mb-2 block">Reason for cancellation</label>
                <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Unforeseen weather conditions..."
                className="w-full p-3 rounded-xl bg-gray-50 border border-[#E5E7EB] text-[#0F172A] focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all resize-none"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                className="px-4 py-3 rounded-xl bg-gray-100 text-[#64748B] hover:bg-gray-200 font-semibold transition-colors"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Event
              </button>
              <button
                className="px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold shadow-lg shadow-red-500/30 transition-all disabled:opacity-50"
                onClick={async () => {
                  if (!cancelReason.trim()) {
                    alert("Please provide a reason for cancelling the event.");
                    return;
                  }
                  await deleteEvent();
                }}
                disabled={actionLoading}
              >
                {actionLoading ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
