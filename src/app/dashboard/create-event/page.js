'use client';

import { useOrganizer } from '@/app/components/ContextProvider';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiPlusCircle, HiLocationMarker, HiPhotograph, HiCalendar, HiCurrencyDollar, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import dynamic from 'next/dynamic';

// Disable SSR for map
const MapPicker = dynamic(() => import('../components/MapPicker'), { ssr: false });

export default function CreateEventPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { refreshOrganizerData } = useOrganizer();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    mode: 'Offline',
    startDate: '',
    endDate: '',
    registrationStartDate: '',
    registrationEndDate: '',
    actualEventDate: '',
    capacity: '',
    organizer: session?.user?.id,
    bannerImage: '',
    status: 'Upcoming',
    coordinates: { lat: 20.5937, lng: 78.9629 },
    isFree: true,
    registrationFee: 0,
    currency: 'INR',
  });

  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Location search state
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);

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
    
    setFormData(prev => ({
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
        setFormData(prev => ({
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
      setMessage('📍 Fetching your location...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            coordinates: { lat: latitude, lng: longitude }
          }));
          
          await reverseGeocode(latitude, longitude);
          
          setMessage('✅ Location set!');
          setTimeout(() => setMessage(''), 3000);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('❌ Unable to fetch location.');
          setTimeout(() => setError(''), 5000);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError('❌ Geolocation is not supported.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((p) => ({ ...p, bannerImage: reader.result }));
        setPreview(reader.result);
      };
      reader.readAsDataURL(files[0]);
    } else if (name === 'registrationFee' || name === 'capacity') {
      setFormData((p) => ({ ...p, [name]: Number(value) }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validate = () => {
      // Basic Fields
      if (!formData.title?.trim() || !formData.description?.trim()) return false;
      
      // Dates
      if (!formData.startDate || !formData.endDate || !formData.registrationStartDate || !formData.registrationEndDate) return false;
      if (new Date(formData.startDate) >= new Date(formData.endDate)) return false; // End after Start
      if (new Date(formData.registrationStartDate) >= new Date(formData.registrationEndDate)) return false; // Reg End after Reg Start
      
      // Location (if Offline)
      if (formData.mode === 'Offline' && !formData.location?.trim()) return false;
      
      // Capacity
      if (!formData.capacity || Number(formData.capacity) <= 0) return false;
      
      // Fee (if Paid)
      if (!formData.isFree && (formData.registrationFee === '' || Number(formData.registrationFee) < 0)) return false;

      return true;
    };
    
    setIsValid(validate());
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      setError('Please fill in all required fields correctly.');
      return;
    }
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage('✅ Event created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        mode: 'Offline',
        startDate: '',
        endDate: '',
        registrationStartDate: '',
        registrationEndDate: '',
        actualEventDate: '',
        capacity: '',
        organizer: session?.user?.id,
        bannerImage: '',
        status: 'Upcoming',
        coordinates: { lat: 20.5937, lng: 78.9629 },
        isFree: true,
        registrationFee: 0,
        currency: 'INR',
      });
      setPreview(null);
      await refreshOrganizerData();
      
      // Optional: Redirect
      // router.push('/dashboard/events');
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600"></div>
          <span className="text-[#0F172A] text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 md:px-8 py-12">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex p-4 rounded-2xl bg-blue-50 mb-4 shadow-sm">
            <HiPlusCircle className="text-4xl text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-3">
            Create New Event
          </h1>
          <p className="text-[#64748B] text-lg max-w-2xl mx-auto">
            Bring your community together. Fill in the details below to publish your event.
          </p>
        </div>

        {message && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2">
            <HiCheckCircle className="text-xl" /> {message}
          </div>
        )}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <HiExclamationCircle className="text-xl" /> {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN - Main Info */}
          <div className="lg:col-span-8 space-y-8">

            {/* Event Info */}
            <Card title="📌 Event Information">
              <Input label="Event Title" name="title" placeholder="e.g. Tech Summit 2024" value={formData.title} onChange={handleChange} />
              <Textarea label="Description" name="description" placeholder="Describe what makes your event special..." value={formData.description} onChange={handleChange} />
            </Card>

            {/* Dates */}
            <Card title="📅 Schedule">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input type="date" name="startDate" label="Start Date" value={formData.startDate} onChange={handleChange} />
                <Input type="date" name="endDate" label="End Date" value={formData.endDate} onChange={handleChange} />
                <div className="md:col-span-2">
                  <Input type="date" name="actualEventDate" label="Main Event Date (Display)" value={formData.actualEventDate} onChange={handleChange} />
                </div>
              </div>
            </Card>

            {/* Location */}
            <Card title="📍 Location">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Select name="mode" label="Event Mode" value={formData.mode} onChange={handleChange}>
                  <option>Offline</option>
                  <option>Online</option>
                </Select>
                <button
                  type="button"
                  onClick={getUserLocation}
                  className="flex items-center justify-center gap-2 mt-7 h-[50px]
                            bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition font-medium border border-blue-200"
                >
                  <HiLocationMarker /> Use My Location
                </button>
              </div>

              <div className="relative mb-6">
                <label className="text-sm font-semibold text-[#0F172A] mb-2 block">Address / Venue</label>
                <div className="relative">
                  <input
                    name="location"
                    className="w-full p-3.5 bg-white border border-[#E5E7EB] rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-[#0F172A] placeholder:text-gray-400"
                    placeholder="Search for a location..."
                    value={formData.location}
                    autoComplete="off"
                    onChange={(e) => {
                      handleChange(e);
                      setLocationSearch(e.target.value);
                    }}
                    onFocus={() => {
                      if (locationSuggestions.length > 0) setShowSuggestions(true);
                    }}
                  />
                  {searchingLocation && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-5 w-5 rounded-full border-t-2 border-blue-500"></div>
                    </div>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-[1000] w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {locationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleLocationSelect(suggestion)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition"
                      >
                        <p className="text-sm text-[#0F172A]">{suggestion.display_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formData.mode === 'Offline' && (
                <div className="rounded-xl overflow-hidden border border-[#E5E7EB] h-[300px]">
                  <MapPicker
                    initialPosition={formData.coordinates}
                    onLocationSelect={(pos) =>
                      setFormData(prev => ({ ...prev, coordinates: pos }))
                    }
                  />
                </div>
              )}
            </Card>

          </div>

          {/* RIGHT COLUMN - Sidebar */}
          <div className="lg:col-span-4 space-y-8">

            {/* Banner */}
            <Card title="🖼️ Event Banner">
              <div className="relative group cursor-pointer">
                <input type="file" accept="image/*" onChange={handleChange} className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" />
                <div className={`w-full h-64 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center transition-all bg-gray-50 group-hover:bg-blue-50 group-hover:border-blue-400 ${preview ? 'border-none p-0 overflow-hidden' : 'p-6'}`}>
                  {preview ? (
                     <img src={preview} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <HiPhotograph className="text-4xl text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" />
                      <p className="text-sm text-gray-500 font-medium group-hover:text-blue-600">Click to upload banner</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Registration Window */}
            <Card title="📝 Registration Window">
              <div className="space-y-4">
                <Input type="date" name="registrationStartDate" label="Opens At" value={formData.registrationStartDate} onChange={handleChange} />
                <Input type="date" name="registrationEndDate" label="Closes At" value={formData.registrationEndDate} onChange={handleChange} />
              </div>
            </Card>

            {/* Capacity & Fee */}
            <Card title="💰 Ticket Details">
              <Input type="number" name="capacity" label="Total Capacity" value={formData.capacity} onChange={handleChange} />
              
              <div className="pt-4 border-t border-gray-100 mt-4">
                <label className="text-sm font-semibold text-[#0F172A] mb-3 block">Pricing Model</label>
                <div className="flex gap-4 mb-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.isFree ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="isFree" checked={formData.isFree === true} onChange={() => setFormData(p => ({ ...p, isFree: true, registrationFee: 0 }))} className="hidden" />
                    <span className="font-semibold">Free</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${!formData.isFree ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="isFree" checked={formData.isFree === false} onChange={() => setFormData(p => ({ ...p, isFree: false }))} className="hidden" />
                    <span className="font-semibold">Paid</span>
                  </label>
                </div>

                {!formData.isFree && (
                  <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                    <Input name="registrationFee" type="number" label="Amount" value={formData.registrationFee} onChange={handleChange} />
                    <Select name="currency" label="Currency" value={formData.currency} onChange={handleChange}>
                      <option>INR</option>
                      <option>USD</option>
                      <option>EUR</option>
                    </Select>
                  </div>
                )}
              </div>
            </Card>

          </div>

          {/* SUBMIT BUTTON - Full Width Bottom */}
          <div className="lg:col-span-12 mt-4 pb-12">
            <button
              disabled={!isValid}
              className={`w-full py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
                isValid
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
              }`}
            >
              <HiPlusCircle className="text-2xl" />
              {isValid ? 'Publish Event Now' : 'Fill all fields to Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =======================
   REUSABLE COMPONENTS
======================= */

const Card = ({ title, children }) => (
  <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm mb-6 hover:shadow-md transition-shadow duration-300">
    <h3 className="text-lg font-bold text-[#0F172A] mb-5 flex items-center gap-2">
      {title}
    </h3>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div className="w-full">
    <label className="text-sm font-semibold text-[#0F172A] mb-2 block">{label}</label>
    <input 
      {...props} 
      className="w-full p-3.5 bg-gray-50 border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-[#0F172A] placeholder:text-gray-400 font-medium"
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="w-full">
    <label className="text-sm font-semibold text-[#0F172A] mb-2 block">{label}</label>
    <textarea 
      {...props} 
      className="w-full p-3.5 bg-gray-50 border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-[#0F172A] placeholder:text-gray-400 min-h-[150px] font-medium" 
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div className="w-full">
    <label className="text-sm font-semibold text-[#0F172A] mb-2 block">{label}</label>
    <div className="relative">
      <select 
        {...props} 
        className="w-full p-3.5 bg-gray-50 border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-[#0F172A] font-medium appearance-none cursor-pointer"
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  </div>
);
