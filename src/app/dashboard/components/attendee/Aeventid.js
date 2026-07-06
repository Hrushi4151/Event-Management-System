'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HiCalendar, HiLocationMarker, HiClock, HiUser, HiMail, HiTicket, HiX, HiSearch, HiCheckCircle, HiBadgeCheck, HiPhotograph, HiStar, HiXCircle } from 'react-icons/hi';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { TruncatedAddress } from '../TruncatedAddress';

// Dynamic import to avoid SSR issues with Leaflet
const MapDisplay = dynamic(() => import('../MapDisplay'), { ssr: false });


export default function EventDetailsPage({params}) {

  const {id}=useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [event, setEventData] = useState();
  const [organizer, setOrgnizer] = useState();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [totalMembers, setTotalMembers] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedLeader, setSelectedLeader] = useState(null); // Selected team leader
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [userRegistration, setUserRegistration] = useState(null);
  const [registrationQRCode, setRegistrationQRCode] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState(null);
  

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      // Fetch only attendees (not organizers)
      const res = await fetch('/api/users?role=attendee');
      if (res.ok) {
        const users = await res.json();
        // Transform users to match the expected format
        const formattedUsers = users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          profile: user.avatar || '',
        }));
        setAvailableUsers(formattedUsers);
      } else {
        console.error('Failed to fetch users');
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Check if user is already registered for this event
  const checkRegistrationStatus = async () => {
    if (!session?.user?.id || !id) return;
    
    try {
      const res = await fetch(`/api/registration/user/${session.user.id}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const registrations = await res.json();
          const registration = registrations.find(
            (reg) => reg.event._id === id || reg.event === id
          );
          if (registration) {
            setIsRegistered(true);
            setUserRegistration(registration);
          } else {
            setIsRegistered(false);
            setUserRegistration(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${id}`);
      
      if (!res.ok) throw new Error("Failed to load events");
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Invalid response format");
      }
      
      const json = await res.json();
      const Userres = await fetch(`/api/organizer/${json.organizer}`);
      if (!Userres.ok) throw new Error("Failed to load organizer");
      
      const userContentType = Userres.headers.get('content-type');
      if (!userContentType || !userContentType.includes('application/json')) {
        throw new Error("Invalid organizer response format");
      }
      
      const Userjson = await Userres.json();
      setEventData(json);
      setOrgnizer({
        name: Userjson.name,
        profile: Userjson.avatar,
        email: Userjson.email,
      })
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load event details. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
    fetchEvents();
    }
  }, [id]);

  useEffect(() => {
    if (id && session?.user?.id) {
      checkRegistrationStatus();
    }
  }, [id, session?.user?.id]);

  // Fetch users when modal opens and set registering user as default leader
  useEffect(() => {
    if (showModal) {
      fetchUsers();
      // Set registering user as default leader
      if (session?.user) {
        setSelectedLeader({
          id: 'current-user',
          name: session.user.name,
          email: session.user.email,
          profile: session.user.image || '',
          isCurrentUser: true,
        });
      }
    } else {
      // Reset selections when modal closes
      setSelectedMembers([]);
      setSelectedLeader(null);
      setTotalMembers(1);
      setTeamName('');
      setSearch('');
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, session?.user]);

  // Handle Stripe payment success callback
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId) {
        // Get pending registration data from sessionStorage
        const pendingData = sessionStorage.getItem('pendingRegistrationData');
        
        if (pendingData) {
          try {
            const registrationData = JSON.parse(pendingData);
            
            // Verify payment with backend
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId }),
            });

            if (!verifyRes.ok) {
              throw new Error('Payment verification failed');
            }

            const paymentData = await verifyRes.json();

            // Complete registration
            await processRegistration(registrationData, {
              paymentId: paymentData.paymentIntentId,
              amount: paymentData.amount,
              currency: paymentData.currency,
            });

            // Clear pending data
            sessionStorage.removeItem('pendingRegistrationData');
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error) {
            console.error('Error processing payment callback:', error);
            setError('Payment verification failed. Please contact support.');
          }
        }
      }
    };

    handlePaymentSuccess();
  }, []);

  const toggleMember = (member) => {
    const isSelected = selectedMembers.some(m => m.id === member.id);
    
    if (isSelected) {
      // Remove member
      setSelectedMembers(prev => prev.filter(m => m.id !== member.id));
    } else {
      // Check if we've reached the limit
      const currentCount = selectedMembers.length + 1; // +1 for leader
      
      if (currentCount >= totalMembers) {
        setError(`You can only select ${totalMembers - 1} team member(s) (excluding leader)`);
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // Add member
      setSelectedMembers(prev => [...prev, member]);
    }
  };

  const selectLeader = (member) => {
    // If selecting the current user, use special marker
    if (member.id === 'current-user') {
      setSelectedLeader({
        id: 'current-user',
        name: session.user.name,
        email: session.user.email,
        profile: session.user.image || '',
        isCurrentUser: true,
      });
    } else {
      // If the member was in selectedMembers, remove them
      setSelectedMembers(prev => prev.filter(m => m.id !== member.id));
      
      // Set as leader
      setSelectedLeader(member);
    }
  };

  const handleConfirm = async () => {
    // Validation
    if (!selectedLeader) {
      setError('Please select a team leader');
      return;
    }

    const currentCount = selectedMembers.length + 1; // +1 for leader
    if (currentCount !== totalMembers) {
      setError(`Please select exactly ${totalMembers} member(s) including the leader`);
      return;
    }

    if (totalMembers > 1 && !teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    setError('');
    setIsRegistering(true);

    try {
      // Prepare registration data
      const registrationData = {
        event: id,
        teamName: totalMembers > 1 ? teamName : null,
        leader: {
          userId: selectedLeader.isCurrentUser ? session.user.id : selectedLeader.id,
          name: selectedLeader.name,
          email: selectedLeader.email,
        },
        teamMembers: selectedMembers.map(member => ({
          userId: member.id,
          name: member.name,
          email: member.email,
        })),
        totalMembers,
      };

      // Check if payment is required
      if (!event.isFree && event.registrationFee > 0) {
        // Store registration data for after payment
        setPendingRegistrationData(registrationData);
        setShowModal(false);
        setShowPaymentModal(true);
      } else {
        // Free event - proceed with registration
        await processRegistration(registrationData);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const processRegistration = async (registrationData, paymentDetails = null) => {
    try {
      const payload = {
        ...registrationData,
        paymentDetails,
      };

      const res = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await res.json();
      
      setSuccess('Registration successful! 🎉');
      setRegistrationQRCode(data.qrCode);
      setShowQRModal(true);
      setShowModal(false);
      setShowPaymentModal(false);
      
      // Reset form
      setTeamName('');
      setTotalMembers(1);
      setSelectedMembers([]);
      setSelectedLeader(null);
      
      // Refresh registration status
      await checkRegistrationStatus();
      
      setTimeout(() => {
        setSuccess('');
        setShowQRModal(false);
      }, 5000);
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentProcessing(true);
      setError('');

      // Create Stripe checkout session
      const res = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: event.registrationFee,
          currency: event.currency || 'INR',
          eventId: id,
          eventTitle: event.title,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from payment server');
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create payment session');
      }

      const { sessionId, url } = await res.json();

      // Store pending registration data in sessionStorage
      sessionStorage.setItem('pendingRegistrationData', JSON.stringify(pendingRegistrationData));

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#2563EB]"></div>
          <span className="text-lg text-[#64748B]">Loading event...</span>
        </div>
      </div>
    );
  }

  // Check registration window
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at 00:00:00
  
  const registrationStart = event?.registrationStartDate 
    ? new Date(new Date(event.registrationStartDate).setHours(0, 0, 0, 0)) 
    : null;
  const registrationEnd = event?.registrationEndDate 
    ? new Date(new Date(event.registrationEndDate).setHours(23, 59, 59, 999)) 
    : null;
  
  let canRegister = true;
  let registrationMessage = '';
  
  if (registrationStart && today < registrationStart) {
    canRegister = false;
    registrationMessage = `Registration opens on ${new Date(event.registrationStartDate).toLocaleDateString()}`;
  } else if (registrationEnd && today > registrationEnd) {
    canRegister = false;
    registrationMessage = `Registration closed on ${new Date(event.registrationEndDate).toLocaleDateString()}`;
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 lg:px-16 bg-[#F8FAFC]">
      <Script 
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Hero Section with Banner */}
        <div className="bg-white rounded-2xl p-0 mb-8 overflow-hidden border border-[#E5E7EB] animate-fadeIn">
          {event.bannerImage && (
            <div className="relative h-80 bg-gradient-to-br from-blue-500 to-purple-600">
              <img 
                src={event.bannerImage} 
                alt={event.title} 
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{event?.title}</h1>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                    {event.mode}
                  </span>
                  {event.status === 'Cancelled' && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EF4444] text-white">Cancelled</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cancelled Event Alert */}
        {event.status === 'Cancelled' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8 animate-slideIn flex items-start gap-4">
            <HiXCircle className="text-3xl text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-red-900 text-lg mb-1">Event Cancelled</h3>
              <p className="text-sm text-red-700">
                This event has been cancelled by the organizer.
                {event.cancelledAt && ` (Cancelled on ${new Date(event.cancelledAt).toLocaleDateString()})`}
              </p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
              <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
                <div className="text-2xl mb-1">📅</div>
                <div className="text-xs text-[#64748B]">Start Date</div>
                <div className="text-sm font-semibold text-[#0F172A] mt-1">{new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-xs text-[#64748B]">End Date</div>
                <div className="text-sm font-semibold text-[#0F172A] mt-1">{new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
                <div className="text-2xl mb-1">📍</div>
                <div className="text-xs text-[#64748B]">Mode</div>
                <div className="text-sm font-semibold text-[#0F172A] mt-1">{event.mode}</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-center">
                <div className="text-2xl mb-1">{event.isFree ? '🎁' : '💰'}</div>
                <div className="text-xs text-[#64748B]">Fee</div>
                <div className="text-sm font-semibold text-[#10B981] mt-1">
                  {event.isFree ? 'Free' : `${event.currency === 'INR' ? '₹' : event.currency === 'USD' ? '$' : '€'}${event.registrationFee}`}
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] animate-fadeIn">
              <h2 className="text-xl font-bold text-[#0F172A] mb-4">About This Event</h2>
              <p className="text-[#64748B] leading-relaxed">
                {event?.description || 'No description available'}
              </p>
            </div>

            {/* Map & Location - Left Column */}
            {event.location && (
              <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm animate-fadeIn">
                <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                  <HiLocationMarker className="text-[#2563EB] text-xl" />
                  Event Location
                </h2>
                
                {/* Address */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📍</div>
                    <div className="flex-1">
                      <div className="text-xs text-[#64748B] mb-1 font-medium uppercase tracking-wide">Venue Address</div>
                      <div className="text-[#0F172A] font-semibold text-sm leading-relaxed">
                        <TruncatedAddress address={event.location} maxLength={100} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map */}
                {event.coordinates && (
                  <div className="rounded-xl overflow-hidden border-2 border-[#E5E7EB]">
                    <MapDisplay coordinates={event.coordinates} locationName={event.location} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Timeline, Organizer & Tickets */}
          <div className="space-y-6">
            {/* Registration/Ticket Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm animate-fadeIn">
              {!event.isFree && (
                <div className="mb-6 text-center">
                  <div className="text-sm text-[#64748B] mb-1">Registration Fee</div>
                  <div className="text-3xl font-bold text-[#10B981]">
                    {event.currency === 'INR' && '₹'}
                    {event.currency === 'USD' && '$'}
                    {event.currency === 'EUR' && '€'}
                    {event.registrationFee}
                  </div>
                </div>
              )}

              {event.status === 'Cancelled' ? (
                <button className="w-full px-6 py-4 bg-gray-500 text-white rounded-xl cursor-not-allowed flex items-center justify-center gap-2 font-medium" disabled>
                  <HiXCircle /> Event Cancelled
                </button>
              ) : isRegistered ? (
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                >
                  <HiTicket /> View Ticket
                </button>
              ) : !canRegister ? (
                <div className="bg-gray-100 text-[#64748B] px-6 py-4 rounded-xl text-center border border-[#E5E7EB]">
                  <HiClock className="inline mr-2" />
                  {registrationMessage}
                </div>
              ) : (
                <button
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                  onClick={() => setShowModal(true)}
                >
                  <HiTicket /> Register Now
                </button>
              )}

              {event.isFree && (
                <div className="mt-4 text-center">
                  <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-50 text-[#10B981] border border-green-200">Free Event</span>
                </div>
              )}
            </div>

            {/* Event Timeline - Compact & Attractive */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-5 border border-[#E5E7EB] shadow-sm animate-fadeIn">
              <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                <HiCalendar className="text-[#2563EB] text-xl" />
                Event Timeline
              </h2>
              
              {/* Event Dates - Compact Cards */}
              <div className="space-y-3">
                {/* Start Date */}
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-200">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg">
                    🚀
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#64748B] font-medium">Starts</div>
                    <div className="font-bold text-sm text-[#0F172A]">{event.startDate}</div>
                  </div>
                </div>

                {/* End Date */}
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-purple-200">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-lg">
                    🏁
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#64748B] font-medium">Ends</div>
                    <div className="font-bold text-sm text-[#0F172A]">{event.endDate}</div>
                  </div>
                </div>

                {/* Main Event Date */}
                {event.actualEventDate && (
                  <div className="flex items-center gap-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-3 border-2 border-[#2563EB]">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white text-lg">
                      ⭐
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-[#2563EB] font-bold">Main Event</div>
                      <div className="font-bold text-sm text-[#0F172A]">{event.actualEventDate}</div>
                    </div>
                  </div>
                )}

                {/* Registration Dates */}
                {(event.registrationStartDate || event.registrationEndDate) && (
                  <>
                    <div className="border-t border-[#E5E7EB] my-3 pt-3">
                      <div className="text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">Registration Period</div>
                    </div>
                    
                    {event.registrationStartDate && (
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-green-200">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-lg">
                          📝
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-green-700 font-medium">Opens</div>
                          <div className="font-bold text-sm text-[#0F172A]">{event.registrationStartDate}</div>
                        </div>
                      </div>
                    )}

                    {event.registrationEndDate && (
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-orange-200">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-lg">
                          ⏰
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-orange-700 font-medium">Closes</div>
                          <div className="font-bold text-sm text-[#0F172A]">{event.registrationEndDate}</div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Organizer Card */}
            {organizer && (
              <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm animate-fadeIn">
                <h3 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                  <HiUser className="text-[#2563EB] text-xl" />
                  Organizer
                </h3>
                <div className="flex items-center gap-4">
                  {organizer.profile ? (
                    <img 
                      src={organizer.profile} 
                      alt={organizer.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#E5E7EB]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                      {organizer.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-[#0F172A]">{organizer.name}</div>
                    <div className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
                      <HiMail className="text-[#64748B]" />
                      {organizer.email}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Completed Event Features Display - Full Width */}
        {event && event.endDate && new Date(event.endDate) < new Date() && (
          <div className="mt-8 space-y-6">
            {/* Event Photos */}
            {event.eventPhotos && event.eventPhotos.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] animate-fadeIn">
                <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <HiPhotograph className="text-[#2563EB]" />
                  Event Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {event.eventPhotos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Event photo ${index + 1}`}
                      className="w-full h-48 object-cover rounded-xl hover:scale-105 transition-transform cursor-pointer border border-[#E5E7EB]"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Winners */}
            {event.winners && event.winners.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] animate-fadeIn">
                <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <HiBadgeCheck className="text-[#2563EB]" />
                  Winners
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {event.winners.map((winner, index) => (
                    <div key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 text-center border border-yellow-200">
                      <div className="text-3xl mb-2">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && '🏆'}
                      </div>
                      <div className="font-bold text-lg mb-1 text-[#0F172A]">{winner.position}</div>
                      {winner.teamName && <div className="text-[#64748B] font-semibold">{winner.teamName}</div>}
                      {winner.leaderName && <div className="text-sm text-[#64748B]">{winner.leaderName}</div>}
                      {winner.prize && <div className="text-sm text-orange-600 mt-2">{winner.prize}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonials */}
            {event.testimonials && event.testimonials.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] animate-fadeIn">
                <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <HiStar className="text-[#2563EB]" />
                  Testimonials
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.testimonials.map((testimonial, index) => (
                    <div key={index} className="bg-[#F8FAFC] rounded-xl p-6 border border-[#E5E7EB]">
                      <div className="flex items-center gap-2 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <HiStar
                            key={i}
                            className={i < (testimonial.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <p className="text-[#64748B] italic mb-3">"{testimonial.text}"</p>
                      <div className="text-sm">
                        <div className="font-semibold text-[#0F172A]">{testimonial.name}</div>
                        <div className="text-[#64748B]">{testimonial.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <HiTicket className="text-3xl" /> Register for Event
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
              >
                <HiX className="text-2xl" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="alert alert-error">
                  <HiXCircle className="text-xl" />
                  <span>{error}</span>
                </div>
              )}

              {/* Team Size */}
              <div>
                <label className="label">Team Size</label>
                <input
                  type="number"
                  min="1"
                  value={totalMembers}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setTotalMembers(value);
                    if (value === 1) {
                      setTeamName('');
                      setSelectedMembers([]);
                    }
                  }}
                  className="input"
                />
              </div>

              {/* Team Name */}
              {totalMembers > 1 && (
                <div>
                  <label className="label">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="input"
                  />
                </div>
              )}

              {/* Leader Selection */}
              <div>
                <label className="label">Select Team Leader</label>
                <div className="space-y-2">
                  {/* Current User Option */}
                  <div
                    onClick={() => selectLeader({ id: 'current-user' })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedLeader?.isCurrentUser
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <HiUser className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{session?.user?.name} (You)</div>
                        <div className="text-sm text-gray-500">{session?.user?.email}</div>
                      </div>
                      {selectedLeader?.isCurrentUser && (
                        <HiCheckCircle className="ml-auto text-blue-600 text-2xl" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members Selection */}
              {totalMembers > 1 && (
                <div>
                  <label className="label">
                    Select Team Members ({selectedMembers.length}/{totalMembers - 1})
                  </label>
                  
                  {/* Search */}
                  <div className="relative mb-4">
                    <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search users..."
                      className="input pl-12"
                    />
                  </div>

                  {/* User List */}
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {loadingUsers ? (
                      <div className="text-center py-8 text-gray-500">Loading users...</div>
                    ) : (
                      availableUsers
                        .filter(user => 
                          user.name.toLowerCase().includes(search.toLowerCase()) ||
                          user.email.toLowerCase().includes(search.toLowerCase())
                        )
                        .map(user => {
                          const isSelected = selectedMembers.some(m => m.id === user.id);
                          const isLeader = selectedLeader?.id === user.id;
                          
                          return (
                            <div
                              key={user.id}
                              onClick={() => !isLeader && toggleMember(user)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                isLeader
                                  ? 'border-blue-500 bg-blue-50 cursor-not-allowed opacity-60'
                                  : isSelected
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {user.profile && (
                                  <img 
                                    src={user.profile} 
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="font-semibold">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                                {isLeader && (
                                  <span className="badge badge-primary">Leader</span>
                                )}
                                {isSelected && !isLeader && (
                                  <HiCheckCircle className="text-green-600 text-2xl" />
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handleConfirm}
                disabled={isRegistering}
                className="btn btn-primary w-full"
              >
                {isRegistering ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <HiCheckCircle /> Confirm Registration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white text-center">💳 Complete Payment</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {error && (
                <div className="alert alert-error">
                  <HiXCircle />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 text-center border border-blue-200">
                <div className="text-sm text-gray-600 mb-2">Registration Fee</div>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {event.currency === 'INR' && '₹'}
                  {event.currency === 'USD' && '$'}
                  {event.currency === 'EUR' && '€'}
                  {event.registrationFee}
                </div>
                <div className="text-xs text-gray-500">Event: {event.title}</div>
              </div>

              <button
                onClick={handlePayment}
                disabled={paymentProcessing}
                className="btn btn-success w-full"
              >
                {paymentProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>💳 Pay Now</>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Secure payment processing • Your data is protected
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal - Redesigned */}
      {showTicketModal && userRegistration && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-scaleIn">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-8 rounded-t-3xl z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <HiTicket className="text-3xl text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">Your Event Ticket</h2>
                      <p className="text-blue-100 text-sm mt-1">Keep this safe for event entry</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                >
                  <HiX className="text-2xl" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm ${
                  userRegistration.status === 'Accepted' 
                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                    : userRegistration.status === 'Pending'
                    ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                    : 'bg-red-100 text-red-700 border-2 border-red-300'
                }`}>
                  {userRegistration.status === 'Accepted' && <HiCheckCircle className="text-xl" />}
                  {userRegistration.status === 'Pending' && <HiClock className="text-xl" />}
                  {userRegistration.status === 'Rejected' && <HiXCircle className="text-xl" />}
                  {userRegistration.status}
                </div>
              </div>

              {/* QR Code Section - Prominent */}
              {userRegistration.qrCode && (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border-2 border-blue-200">
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <QRCodeSVG
                        value={userRegistration.qrCode}
                        size={220}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-sm font-semibold text-gray-700 mb-2">QR Code ID</p>
                      <p className="text-xs font-mono bg-white px-4 py-2 rounded-lg text-gray-600 border border-gray-200 inline-block">
                        {userRegistration.qrCode}
                      </p>
                      <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Show this QR code at the event entrance
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Details Card */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <HiCalendar className="text-blue-600 text-xl" />
                    Event Information
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-500 font-medium">Event Name</span>
                    <span className="font-bold text-gray-900 text-right max-w-xs">{event?.title}</span>
                  </div>
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-500 font-medium">Start Date</span>
                    <span className="font-semibold text-gray-900">{event?.startDate}</span>
                  </div>
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-500 font-medium">End Date</span>
                    <span className="font-semibold text-gray-900">{event?.endDate}</span>
                  </div>
                  {event?.location && (
                    <>
                      <div className="h-px bg-gray-200"></div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-gray-500 font-medium">Location</span>
                        <span className="font-semibold text-gray-900 text-right max-w-xs">{event.location}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Registration Details Card */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <HiUser className="text-purple-600 text-xl" />
                    Registration Details
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {userRegistration.teamName && (
                    <>
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-gray-500 font-medium">Team Name</span>
                        <span className="font-bold text-gray-900">{userRegistration.teamName}</span>
                      </div>
                      <div className="h-px bg-gray-200"></div>
                    </>
                  )}
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-500 font-medium">Leader</span>
                    <span className="font-semibold text-gray-900">{userRegistration.leader?.name || userRegistration.name}</span>
                  </div>
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-500 font-medium">Email</span>
                    <span className="font-semibold text-gray-900 text-right">{userRegistration.leader?.email || userRegistration.email}</span>
                  </div>
                  
                  {/* Team Members */}
                  {userRegistration.teamMembers && userRegistration.teamMembers.length > 0 && (
                    <>
                      <div className="h-px bg-gray-200"></div>
                      <div>
                        <span className="text-sm text-gray-500 font-medium block mb-3">
                          Team Members ({userRegistration.teamMembers.length})
                        </span>
                        <div className="space-y-2">
                          {userRegistration.teamMembers.map((member, idx) => (
                            <div key={idx} className="bg-gradient-to-r from-gray-50 to-purple-50 p-4 rounded-xl border border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {member.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 text-sm">{member.name}</div>
                                  <div className="text-xs text-gray-500">{member.email}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-500 font-medium">Registered On</span>
                    <span className="font-semibold text-gray-900 text-right text-sm">
                      {new Date(userRegistration.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <HiCheckCircle className="text-xl" />
                  Done
                </button>
              </div>

              {/* Footer Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-700 font-medium">
                  💡 Tip: Take a screenshot of this ticket for quick access at the event
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Success Modal */}
      {showQRModal && registrationQRCode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-scaleIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-t-2xl text-center">
              <HiCheckCircle className="text-6xl text-white mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white">Registration Successful!</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                <QRCodeSVG
                  value={registrationQRCode}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-xs text-gray-600 mt-4 text-center">
                  Save this QR code - you'll need it at the event entrance
                </p>
              </div>
              
              <button
                onClick={() => setShowQRModal(false)}
                className="btn btn-primary w-full"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}