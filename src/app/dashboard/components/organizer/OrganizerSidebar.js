'use client';

import {
  FaPlus,
  FaChartBar,
  FaUserCircle,
} from 'react-icons/fa';
import { TbLayoutDashboardFilled } from 'react-icons/tb';
import { MdEvent } from 'react-icons/md';
import { HiQrcode } from 'react-icons/hi';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import QRScannerModal from './QRScannerModal';

export default function OrganizerSidebar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const menuRef = useRef();
  const pathname = usePathname();

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { href: '/dashboard', icon: TbLayoutDashboardFilled, label: 'Dashboard', color: 'blue' },
    { href: '/dashboard/events', icon: MdEvent, label: 'Events', color: 'purple' },
    { href: '/dashboard/create-event', icon: FaPlus, label: 'New Event', color: 'green' },
    { href: '/dashboard/analytics', icon: FaChartBar, label: 'Analytics', color: 'orange' },
    { href: '/dashboard/profile', icon: FaUserCircle, label: 'Profile', color: 'indigo' },
    { href: '/dashboard/qrscanner', icon: HiQrcode, label: 'QR Scanner', color: 'indigo' },
  ];

  const isActive = (href) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  const getColorClasses = (color, active) => {
    const colors = {
      blue: active ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600',
      purple: active ? 'bg-purple-50 text-purple-600 border-purple-200' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600',
      green: active ? 'bg-green-50 text-green-600 border-green-200' : 'text-gray-600 hover:bg-green-50 hover:text-green-600',
      orange: active ? 'bg-orange-50 text-orange-600 border-orange-200' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600',
      indigo: active ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <aside className="h-full w-56 bg-white flex flex-col py-6 px-3 gap-6 border border-gray-200 shadow-sm rounded-2xl">
      
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-3 group">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl 
                        flex items-center justify-center shadow-md transform transition-all 
                        duration-300 group-hover:scale-110">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M8 12l2.5 2.5L16 9" stroke="#fff" strokeWidth="2.5" 
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-gray-900 font-bold text-lg">EventFlow</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl
                        transition-all duration-200 border
                        ${active ? getColorClasses(item.color, true) + ' border-l-4 font-medium' : getColorClasses(item.color, false) + ' border-transparent'}`}
            >
              <Icon className="text-xl flex-shrink-0" />
              <span className="text-sm">
                {item.label}
              </span>
              {active && (
                <div className="ml-auto w-2 h-2 rounded-full bg-current"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Avatar with Menu */}
      <div className="relative border-t border-gray-200 pt-4" ref={menuRef}>
        <div 
          onClick={() => setMenuOpen(prev => !prev)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 
                     cursor-pointer transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-full border-2 border-purple-500 overflow-hidden flex-shrink-0 bg-purple-100">
            <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold">
              O
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-sm font-medium truncate">Organizer</p>
            <p className="text-gray-500 text-xs truncate">View Profile</p>
          </div>
        </div>
        
        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 
                        bg-white rounded-xl shadow-lg overflow-hidden
                        border border-gray-200 animate-fadeIn">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 
                       transition-colors text-gray-700 text-sm"
            >
              <span>👤</span>
              <span>Profile</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 
                       transition-colors text-gray-700 text-sm"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
            <button
              onClick={() => confirm('Are you sure you want to delete your account?')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 
                       transition-colors text-red-600 text-sm border-t border-gray-100"
            >
              <span>⚠️</span>
              <span>Delete Account</span>
            </button>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {qrScannerOpen && (
        <QRScannerModal onClose={() => setQrScannerOpen(false)} />
      )}
    </aside>
  );
}
