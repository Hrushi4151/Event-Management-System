'use client';
import Link from "next/link";
import { useState } from "react";
import { signIn } from 'next-auth/react';
import { FcGoogle } from "react-icons/fc";
import { HiArrowLeft } from "react-icons/hi";

export default function RegisterPage() {
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    role: "attendee",
    college: "",
    organization: "",
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    const { name, email, password, role } = data;

    if (!name || !email || !password || !role) {
      alert("Please fill all fields");
      return;
    }
    if (role === 'organizer' && !data.organization.trim()) {
      alert("Organization is required for organizer role");
      return;
    }
    if (role === 'attendee' && !data.college.trim()) {
      alert("College is required for attendee role");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send verification code");
      
      setStep('otp');
      alert(`Verification code sent to ${data.email}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify & Register
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { ...data, otp } }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Registration failed");

      alert("Registration successful! You can now login.");
      window.location.href = "/login";
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eaf2fb] flex flex-col items-center justify-center font-sans">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md flex flex-col items-center gap-6">
        
        {step === 'otp' && (
          <button 
            onClick={() => setStep('details')}
            className="self-start text-gray-500 hover:text-blue-500 flex items-center gap-1 mb-[-10px]"
          >
            <HiArrowLeft /> Back
          </button>
        )}

        <h1 className="text-2xl font-bold text-[#6EA1B6] mb-2">
          {step === 'details' ? 'Sign Up for EventFlow' : 'Verify Email'}
        </h1>

        {step === 'details' ? (
          <form className="flex flex-col gap-4 w-full text-gray-500">
            <input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              type="text"
              placeholder="Name"
              className="rounded-lg border placeholder-gray-300 border-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <input
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              type="email"
              placeholder="Email"
              className="rounded-lg border placeholder-gray-300 border-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <input
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              type="password"
              placeholder="Password"
              className="rounded-lg border placeholder-gray-300 border-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            
            {/* Role Selection */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Select your role</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setData({ ...data, role: 'attendee', organization: '' })}
                  className={`flex-1 py-2 rounded-lg font-semibold border transition-colors ${
                    data.role === 'attendee'
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Attendee
                </button>
                <button
                  type="button"
                  onClick={() => setData({ ...data, role: 'organizer', college: '' })}
                  className={`flex-1 py-2 rounded-lg font-semibold border transition-colors ${
                    data.role === 'organizer'
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Organizer
                </button>
              </div>
              
              {data.role === 'attendee' && (
                <input
                  type="text"
                  value={data.college}
                  onChange={(e) => setData({ ...data, college: e.target.value })}
                  placeholder="Enter your college name"
                  className="w-full rounded-lg border border-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  required
                />
              )}
              
              {data.role === 'organizer' && (
                <input
                  type="text"
                  value={data.organization}
                  onChange={(e) => setData({ ...data, organization: e.target.value })}
                  placeholder="Enter your organization name"
                  className="w-full rounded-lg border border-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  required
                />
              )}
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="bg-[#6EA1B6] cursor-pointer text-white rounded-full px-6 py-2 font-semibold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex justify-center items-center"
              type="submit"
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : 'Next: Verify Email'}
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-4 w-full text-gray-500 animate-fadeIn">
            <p className="text-sm text-center text-gray-600">
               We sent a 6-digit code to <strong>{data.email}</strong>
            </p>
            
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              type="text"
              placeholder="000000"
              className="text-center text-2xl font-bold tracking-widest rounded-lg border placeholder-gray-300 border-gray-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-400 font-mono"
            />
            
            <button
              onClick={handleRegister}
              disabled={loading}
              className="bg-[#6EA1B6] cursor-pointer text-white rounded-full px-6 py-2 font-semibold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex justify-center items-center"
              type="submit"
            >
               {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : 'Verify & Sign Up'}
            </button>
            
            <button
                type="button"
                onClick={handleSendOTP}
                className="text-sm text-blue-500 hover:underline text-center mt-2"
            >
                Resend Code
            </button>
          </form>
        )}

        {step === 'details' && (
        <div className="w-full">
          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500 bg-white">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full bg-white text-gray-700 border border-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 focus:ring-gray-200 rounded-full px-6 py-2 font-semibold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
            <FcGoogle className="text-2xl" /> Sign up with Google
          </button>
        </div>
        )}

        <div className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
}
