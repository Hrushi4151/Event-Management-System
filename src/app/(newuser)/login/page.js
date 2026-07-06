'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiMail } from 'react-icons/hi';

export default function LoginPage() {
  const router = useRouter();
  const { update } = useSession();
  
  // View states: 'login', 'forgot-email', 'forgot-otp', 'forgot-new-password'
  const [view, setView] = useState('login');
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password states
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
        router.push('/dashboard');
    } else {
        setErrorMsg('❌ Invalid email or password');
        setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoadingGoogle(true);
    try {
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false 
      });
      
      if (result?.error) {
        setErrorMsg('❌ Google sign-in failed. Please try again.');
        setLoadingGoogle(false);
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setErrorMsg('❌ Failed to connect to Google.');
      setLoadingGoogle(false);
    }
  };

  // Step 1: Send OTP for Forgot Password
  const handleForgotSubmitEmail = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setSuccessMsg('✅ OTP sent to your email (and phone if registered)!');
      setView('forgot-otp');
    } catch (err) {
      setErrorMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      setResetToken(data.resetToken);
      setSuccessMsg('✅ OTP Verified!');
      setView('forgot-new-password');
    } catch (err) {
      setErrorMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccessMsg('🎉 Password reset successful! Please login.');
      setPassword(''); 
      // Small delay then switch to login
      setTimeout(() => {
        setSuccessMsg('');
        setView('login');
      }, 2000);
    } catch (err) {
      setErrorMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100vh] bg-[#eaf2fb] flex flex-col items-center justify-center font-sans">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md flex flex-col items-center gap-6 transition-all duration-300">
        
        {/* Header based on view */}
        <h1 className="text-2xl font-bold text-[#6EA1B6] mb-2">
          {view === 'login' && 'Login to EventFlow'}
          {view === 'forgot-email' && 'Forgot Password?'}
          {view === 'forgot-otp' && 'Enter Verification Code'}
          {view === 'forgot-new-password' && 'Set New Password'}
        </h1>
        
        {/* Messages */}
        {errorMsg && (
          <p className="text-red-600 bg-red-100 px-3 py-2 rounded text-sm w-full text-center slide-in-bottom">
            {errorMsg}
          </p>
        )}
        {successMsg && (
          <p className="text-green-600 bg-green-100 px-3 py-2 rounded text-sm w-full text-center slide-in-bottom">
            {successMsg}
          </p>
        )}

        {/* --- VIEW: LOGIN --- */}
        {view === 'login' && (
          <>
            <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full text-gray-500">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-lg border placeholder-gray-300 border-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <div className="flex flex-col gap-1">
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg border placeholder-gray-300 border-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                <button 
                  type="button" 
                  onClick={() => { setErrorMsg(''); setSuccessMsg(''); setView('forgot-email'); }}
                  className="text-xs text-[#6EA1B6] hover:underline self-end mt-1"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                className="bg-[#6EA1B6] cursor-pointer text-white rounded-full px-6 py-2 font-semibold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="w-full">
              <div className="relative flex items-center my-4">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500 bg-white">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loadingGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 rounded-full px-6 py-2 font-semibold transition-all shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                {loadingGoogle ? 'Connecting...' : 'Continue with Google'}
              </button>
            </div>

            <div className="text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-500 hover:underline">Sign Up</Link>
            </div>
          </>
        )}

        {/* --- VIEW: FORGOT - STEP 1 (EMAIL) --- */}
        {view === 'forgot-email' && (
          <form onSubmit={handleForgotSubmitEmail} className="flex flex-col gap-4 w-full text-gray-500">
             <p className="text-sm text-center text-gray-500 mb-2">Enter your registered email to receive an OTP.</p>
             <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-lg border placeholder-gray-300 border-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <button
                className="bg-[#6EA1B6] cursor-pointer text-white rounded-full px-6 py-2 font-semibold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
              <button 
                type="button"
                onClick={() => setView('login')}
                className="text-sm text-gray-500 hover:text-gray-700 mt-2 hover:underline"
              >
                Back to Login
              </button>
          </form>
        )}

        {/* --- VIEW: FORGOT - STEP 2 (OTP) --- */}
        {view === 'forgot-otp' && (
           <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 w-full text-gray-500">
              <p className="text-sm text-center text-gray-500 mb-2">We sent a code to <strong>{email}</strong>.</p>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="rounded-lg border placeholder-gray-300 border-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 text-center tracking-[0.5em] text-lg"
              />
              <button
                className="bg-[#6EA1B6] cursor-pointer text-white rounded-full px-6 py-2 font-semibold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <div className="flex justify-between w-full text-sm mt-2">
                 <button type="button" onClick={() => setView('forgot-email')} className="text-gray-500 hover:underline">Change Email</button>
                 <button type="button" onClick={handleForgotSubmitEmail} className="text-blue-500 hover:underline cursor-pointer">Resend Code</button>
              </div>
           </form>
        )}

        {/* --- VIEW: FORGOT - STEP 3 (NEW PASSWORD) --- */}
        {view === 'forgot-new-password' && (
           <form onSubmit={handleResetPassword} className="flex flex-col gap-4 w-full text-gray-500">
              <p className="text-sm text-center text-gray-500 mb-2">Create a new secure password.</p>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-lg border placeholder-gray-300 border-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <button
                className="bg-[#6EA1B6] cursor-pointer text-white rounded-full px-6 py-2 font-semibold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
           </form>
        )}

      </div>
    </div>
  );
}
