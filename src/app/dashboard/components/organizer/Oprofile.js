'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useOrganizer } from '@/app/components/ContextProvider';
import { 
  HiUser, HiMail, HiPhone, HiPencil, HiSave, HiKey, HiTrash, 
  HiCamera, HiCheckCircle, HiCalendar, HiStar, HiX, HiLockClosed, 
  HiRefresh, HiEye, HiEyeOff, HiOfficeBuilding, HiUsers, HiClock 
} from 'react-icons/hi';
import { HiBuildingOffice2 } from 'react-icons/hi2';

export default function OrganizerProfilePage() {
  const { data: session } = useSession();
  const { organizerData } = useOrganizer();
  
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    role: 'organizer',
    avatar: '/default-profile.png',
    bio: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Forgot Password States
  const [forgotPasswordStep, setForgotPasswordStep] = useState('email'); // 'email', 'otp', 'newPassword'
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Timer checking
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        const res = await fetch(`/api/user/${session.user.id}`);
        if (!res.ok) throw new Error('Failed to fetch profile');
        
        const userData = await res.json();
        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          organization: userData.organization || '',
          role: userData.role || 'organizer',
          avatar: userData.avatar || '/default-profile.png',
          bio: userData.bio || '',
        });
      } catch (err) {
        console.error('Fetch profile error:', err);
        alert('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session?.user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;

    // Validation
    if (!profile.name || profile.name.trim() === '') {
      alert('❌ Name is required');
      return;
    }

    if (!profile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      alert('❌ Please enter a valid email address');
      return;
    }
    
    try {
      setSaving(true);
      const res = await fetch(`/api/user/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name.trim(),
          email: profile.email.trim(),
          phone: profile.phone?.trim() || '',
          organization: profile.organization?.trim() || '',
          bio: profile.bio?.trim() || '',
          avatar: profile.avatar || '',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      // Refresh profile data
      const refreshRes = await fetch(`/api/user/${session.user.id}`, {
        cache: 'no-store',
      });
      if (refreshRes.ok) {
        const updatedData = await refreshRes.json();
        setProfile({
          name: updatedData.name || '',
          email: updatedData.email || '',
          phone: updatedData.phone || '',
          organization: updatedData.organization || '',
          role: updatedData.role || 'organizer',
          avatar: updatedData.avatar || '/default-profile.png',
          bio: updatedData.bio || '',
        });
      }
      
      alert('✅ Profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      console.error('Update profile error:', err);
      alert(`❌ Failed to update profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!session?.user?.id) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('❌ New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('❌ Password must be at least 6 characters');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await fetch(`/api/user/${session.user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update password');
      }

      alert('✅ Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error('Update password error:', err);
      alert(`❌ ${err.message}`);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Forgot Password Functions
  const handleSendOTP = async () => {
    if (!profile.email) {
      alert('No email found in profile');
      return;
    }

    try {
      setOtpLoading(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      alert(`✅ ${data.message}. Check your ${data.otpSentTo.join(' and ')}.`);
      setForgotPasswordStep('otp');
      setOtpTimer(600); // 10 minutes
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifyLoading(true);
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, otp }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      setResetToken(data.resetToken);
      setForgotPasswordStep('newPassword');
      alert('✅ OTP verified! Now set your new password.');
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      setResetLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      alert('✅ Password reset successfully! You can now login with your new password.');
      setShowForgotPassword(false);
      // Reset state
      setForgotPasswordStep('email');
      setOtp('');
      setResetToken('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  const toggleEdit = () => setEditMode(!editMode);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E5E7EB] border-t-[#2563EB]"></div>
          <span className="text-[#0F172A] text-lg font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  // Stats Data for Organizer
  const statsArray = [
    {
      label: 'Events Created',
      value: organizerData?.stats?.totalEvents || 0,
      icon: <HiCalendar className="text-3xl mb-3 opacity-90" />,
      gradient: 'bg-blue-500', 
      shadow: 'shadow-blue-200'
    },
    {
      label: 'Total Attendees',
      value: organizerData?.stats?.totalAttendees || 0,
      icon: <HiUsers className="text-3xl mb-3 opacity-90" />,
      gradient: 'bg-green-500', 
      shadow: 'shadow-green-200'
    },
    {
      label: 'Longest Event',
      value: organizerData?.stats?.longestOngoingEvent?.title || 'N/A',
      icon: <HiClock className="text-3xl mb-3 opacity-90" />,
      gradient: 'bg-yellow-500', 
      shadow: 'shadow-yellow-200'
    },
    {
      label: 'Top Event',
      value: organizerData?.stats?.topPerformingEvent?.title || 'N/A',
      icon: <HiStar className="text-3xl mb-3 opacity-90" />,
      gradient: 'bg-pink-500',
      shadow: 'shadow-pink-200'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 md:px-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-[#0F172A] flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <HiUser className="text-2xl text-white" />
          </div>
          Organizer Profile
        </h1>
        <p className="text-[#64748B] mt-2">Manage your organization details and settings</p>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-[#2563EB] p-1">
                  <img
                    src={profile.avatar || '/default-profile.png'}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                {editMode && (
                  <label className="absolute bottom-0 right-0 bg-[#2563EB] p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-all">
                    <HiCamera className="text-white" />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
              {editMode && (
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="bg-[#F8FAFC] text-[#0F172A] rounded-xl p-2 text-center w-full border border-[#E5E7EB] focus:border-[#2563EB] focus:outline-none"
                />
              )}
              {!editMode && <h2 className="text-xl font-bold text-[#0F172A] text-center">{profile.name}</h2>}
              <p className="text-sm text-[#64748B] text-center capitalize px-4 py-1 bg-blue-50 rounded-full border border-blue-200">{profile.role}</p>
              {profile.organization && <p className="text-sm text-[#64748B] text-center font-medium">{profile.organization}</p>}
            </div>

            {/* Form Section */}
            <div className="md:col-span-3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-[#0F172A] flex items-center gap-2 mb-2">
                    <HiMail className="text-[#2563EB]" />
                    Email
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="w-full rounded-xl bg-[#F8FAFC] text-[#0F172A] p-3 border border-[#E5E7EB] disabled:opacity-60 focus:border-[#2563EB] focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-[#0F172A] flex items-center gap-2 mb-2">
                    <HiPhone className="text-[#2563EB]" />
                    Phone
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="w-full rounded-xl bg-[#F8FAFC] text-[#0F172A] p-3 border border-[#E5E7EB] disabled:opacity-60 focus:border-[#2563EB] focus:outline-none"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-[#0F172A] flex items-center gap-2 mb-2">
                    <HiOfficeBuilding className="text-[#2563EB]" />
                    Organization Name
                  </span>
                  <input
                    type="text"
                    name="organization"
                    value={profile.organization}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="w-full rounded-xl bg-[#F8FAFC] text-[#0F172A] p-3 border border-[#E5E7EB] disabled:opacity-60 focus:border-[#2563EB] focus:outline-none"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-[#0F172A] flex items-center gap-2 mb-2">
                    📝 Bio
                  </span>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    disabled={!editMode}
                    rows={3}
                    className="w-full rounded-xl bg-[#F8FAFC] text-[#0F172A] p-3 border border-[#E5E7EB] disabled:opacity-60 focus:border-[#2563EB] focus:outline-none"
                    placeholder="Tell us about yourself or your organization..."
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={toggleEdit}
                  className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#2563EB] text-[#2563EB] rounded-xl hover:bg-blue-50 transition-all font-semibold"
                >
                  <HiPencil />
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </button>
                {editMode && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <HiSave />
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <HiKey className="text-[#2563EB]" />
                Change Password
              </h3>
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-[#2563EB] hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="password"
                placeholder="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="bg-[#F8FAFC] text-[#0F172A] p-3 rounded-xl border border-[#E5E7EB] focus:border-[#2563EB] focus:outline-none"
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="bg-[#F8FAFC] text-[#0F172A] p-3 rounded-xl border border-[#E5E7EB] focus:border-[#2563EB] focus:outline-none"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="bg-[#F8FAFC] text-[#0F172A] p-3 rounded-xl border border-[#E5E7EB] focus:border-[#2563EB] focus:outline-none md:col-span-2"
              />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={passwordLoading}
              className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg text-white px-6 py-3 rounded-xl disabled:opacity-50 flex items-center gap-2 font-semibold transition-all w-full justify-center"
            >
              {passwordLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                <>
                  <HiLockClosed />
                  Update Password
                </>
              )}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl border-2 border-red-200 p-8">
            <div>
              <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Danger Zone</h3>
              <p className="text-sm text-[#64748B] mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            </div>
            <button 
              onClick={async () => {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  try {
                    const res = await fetch(`/api/user/${session.user.id}`, {
                      method: 'DELETE',
                    });
                    if (res.ok) {
                      alert('Account deleted successfully. You will be logged out.');
                      localStorage.clear();
                      sessionStorage.clear();
                      signOut({ callbackUrl: '/' });
                    } else {
                      const errorData = await res.json();
                      alert(`Failed to delete account: ${errorData.error || 'Unknown error'}`);
                    }
                  } catch (err) {
                    console.error('Delete account error:', err);
                    alert('Failed to delete account');
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all w-full"
            >
              <HiTrash />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-6 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <HiLockClosed className="text-3xl" />
                    Reset Password
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">Recover your account access</p>
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordStep('email');
                    setOtp('');
                    setResetToken('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                >
                  <HiX className="text-2xl" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {forgotPasswordStep === 'email' && (
                <>
                  <div className="text-center">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-100">
                      <HiMail className="text-2xl text-[#2563EB]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0F172A] mb-2">Send OTP?</h3>
                    <p className="text-[#64748B] mb-4">
                      We will send a verification code to your registered email:
                    </p>
                    <div className="bg-gray-50 py-2 px-4 rounded-lg font-mono text-sm text-[#0F172A] border border-gray-200 inline-block mb-4">
                      {profile.email}
                    </div>
                  </div>
                  <button
                    onClick={handleSendOTP}
                    disabled={otpLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {otpLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                </>
              )}

              {forgotPasswordStep === 'otp' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white focus:outline-none text-center text-3xl font-bold tracking-[1em] text-gray-900 placeholder-gray-300 transition-all font-mono"
                    />
                    {otpTimer > 0 && (
                      <p className="text-sm text-gray-500 mt-2 text-center font-medium">
                        Resend in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleVerifyOTP}
                      disabled={verifyLoading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {verifyLoading ? 'Verifying...' : 'Verify Code'}
                    </button>
                    <button
                      onClick={handleSendOTP}
                      disabled={otpLoading || otpTimer > 540}
                      className="px-4 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-blue-600 transition-all disabled:opacity-50"
                      title="Resend OTP"
                    >
                      <HiRefresh className="text-xl" />
                    </button>
                  </div>
                </>
              )}

              {forgotPasswordStep === 'newPassword' && (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none text-gray-900 placeholder-gray-400 transition-all pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 p-1"
                        >
                          {showNewPassword ? <HiEyeOff className="text-xl" /> : <HiEye className="text-xl" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none text-gray-900 placeholder-gray-400 transition-all pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 p-1"
                        >
                          {showConfirmPassword ? <HiEyeOff className="text-xl" /> : <HiEye className="text-xl" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
