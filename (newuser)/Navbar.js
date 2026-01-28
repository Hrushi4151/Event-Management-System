'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoHome, GoHomeFill } from "react-icons/go";
import { MdAssignmentInd, MdDashboard } from "react-icons/md";
import { PiPhoneCall, PiPhoneCallFill } from "react-icons/pi";
import { FaInfoCircle } from "react-icons/fa";
import { IoLogIn, IoLogOut } from "react-icons/io5";
import { HiUser, HiSparkles } from "react-icons/hi";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home", icon: <GoHome className="text-xl" />, activeIcon: <GoHomeFill className="text-xl" /> },
  { href: "/about", label: "About", icon: <FaInfoCircle className="text-xl" />, activeIcon: <FaInfoCircle className="text-xl" /> },
  { href: "/contact", label: "Contact", icon: <PiPhoneCall className="text-xl" />, activeIcon: <PiPhoneCallFill className="text-xl" /> },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 z-50 w-full flex justify-center py-6 pointer-events-none">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="pointer-events-auto w-full max-w-5xl flex items-center justify-between px-4 py-3 rounded-full mx-4"
        style={{
          background: "rgba(2, 2, 255, 0.4)", // Darker, more distinct base
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.15)", // Stronger rim
          border: "1px solid rgba(255, 255, 255, 0.1)" 
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group pl-2">
          <div className="relative w-9 h-9 flex items-center justify-center rounded-full overflow-hidden shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#007AFF] to-[#5856D6] opacity-90"></div>
             <div className="absolute inset-0 bg-white/20 blur-sm"></div>{/* Gloss */}
             <HiSparkles className="relative text-white text-sm animate-pulse z-10" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white drop-shadow-md">
            EventFlow
          </span>
        </Link>
        {/* Central Navigation - Floating Island */}
        <div className="hidden md:flex items-center gap-1 p-1.5 rounded-full bg-white/10 border border-white/10 shadow-inner">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white/20 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-white/20"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`relative px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors duration-300 ${
                  isActive ? "text-white" : "text-white/70 hover:text-white"
                }`}>
                  {isActive ? link.activeIcon : link.icon}
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Auth Actions */}
        <div className="flex items-center gap-4 pr-2">
          {session ? (
            <div className="flex items-center gap-3 pl-4 border-l border-white/20">
               <Link 
                  href="/dashboard" 
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-lg transition-all hover:scale-105"
                >
                  <MdDashboard className="text-lg text-blue-300" />
                  Dashboard
               </Link>
               <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#00C6FF] to-[#0072FF] shadow-lg shadow-blue-500/20">
                 <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center overflow-hidden backdrop-blur-md">
                    {session.user?.image ? (
                        <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold text-white text-xs">{session.user?.name?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                 </div>
               </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:flex px-5 py-2.5 rounded-full text-sm font-semibold text-white/80 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="group relative px-7 py-2.5 rounded-full text-sm font-bold text-white overflow-hidden transition-all hover:scale-105"
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                }}
              >
                <div className="absolute inset-0 bg-white/20 blur-md group-hover:bg-white/30 transition-colors"></div>
                <span className="relative flex items-center gap-2 drop-shadow-sm">
                  Get Started
                </span>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </nav>
  );
}
