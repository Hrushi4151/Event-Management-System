'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { HiCheckCircle, HiX, HiUser, HiMail, HiTicket, HiUsers } from 'react-icons/hi';

export default function QRScannerModal({ isOpen, onClose }) {
  const [scannedData, setScannedData] = useState(null);
  const [registrationInfo, setRegistrationInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const scannerRef = useRef(null);
  const qrCodeScannerRef = useRef(null);

  useEffect(() => {
    if (isOpen && scannerRef.current) {
      const qrCodeScanner = new Html5Qrcode('qr-reader');
      qrCodeScannerRef.current = qrCodeScanner;

      qrCodeScanner
        .start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: 250,
          },
          async (decodedText) => {
            if (!scannedData && !loading) {
              setScannedData(decodedText);
              qrCodeScanner.stop();
              await handleAutoCheckIn(decodedText);
            }
          },
          (errorMessage) => {
            // Optional logging
          }
        )
        .catch((err) => {
          console.error('Camera start error:', err);
          setError('Failed to start camera. Please check permissions.');
        });
    } else if (!isOpen) {
      // Reset state when modal closes
      handleReset();
    }

    return () => {
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen]);

  const handleAutoCheckIn = async (qrCode) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Find registration by QR code (leader or team member)
      const res = await fetch(`/api/registration/qrcode/${encodeURIComponent(qrCode)}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Registration not found');
      }
      
      const registration = await res.json();
      const isLeader = registration.isLeader;
      const scannedMember = registration.scannedMember;

      // Handle leader check-in
      if (isLeader) {
        if (registration.checkedIn) {
          setError('This leader has already been checked in.');
          setLoading(false);
          return;
        }

        // Update leader check-in status
        const updateRes = await fetch(`/api/registration/${registration._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ checkedIn: true }),
        });

        if (!updateRes.ok) {
          const errorData = await updateRes.json();
          throw new Error(errorData.error || 'Failed to check in leader');
        }

        const updatedRegistration = await updateRes.json();
        setRegistrationInfo({
          ...updatedRegistration,
          scannedMember: null,
          isLeader: true,
        });
      } else {
        // Handle team member check-in
        if (scannedMember?.attended) {
          setError('This team member has already been checked in.');
          setLoading(false);
          return;
        }

        // Update team member attendance
        const updateRes = await fetch(`/api/registration/${registration._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamMemberAttendance: {
              memberEmail: scannedMember.email,
              attended: true,
            },
          }),
        });

        if (!updateRes.ok) {
          const errorData = await updateRes.json();
          throw new Error(errorData.error || 'Failed to check in team member');
        }

        const updatedRegistration = await updateRes.json();
        // Find the updated member info
        const updatedMember = updatedRegistration.teamMembers.find(
          m => m.email === scannedMember.email
        );
        
        setRegistrationInfo({
          ...updatedRegistration,
          scannedMember: updatedMember,
          isLeader: false,
        });
      }

      setSuccess(true);
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        handleReset();
      }, 3000);
    } catch (err) {
      console.error('Check-in error:', err);
      setError(err.message || 'Failed to check in attendee');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setRegistrationInfo(null);
    setError('');
    setSuccess(false);
    setLoading(false);
    
    if (qrCodeScannerRef.current && isOpen) {
      qrCodeScannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: 250,
        },
        async (decodedText) => {
          setScannedData(decodedText);
          qrCodeScannerRef.current.stop();
          await handleAutoCheckIn(decodedText);
        },
        () => {}
      ).catch(() => {});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🎟️ QR Code Scanner
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <HiX className="text-2xl" />
          </button>
        </div>

        {/* Scanner Content */}
        <div className="p-6">
          {!success && !error && (
            <div className="flex flex-col items-center gap-4">
              <div id="qr-reader" ref={scannerRef} className="w-full max-w-md border-2 border-blue-500 rounded-lg p-2" />
              {loading && (
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-400"></div>
                  Processing...
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-600 text-white p-4 rounded-lg mb-4">
              <p className="font-semibold">❌ Error</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={handleReset}
                className="mt-3 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-md text-sm"
              >
                Scan Again
              </button>
            </div>
          )}

          {success && registrationInfo && (
            <div className="flex flex-col items-center gap-4">
              <HiCheckCircle className="text-green-500 text-6xl" />
              <p className="text-xl text-green-400 font-bold text-center">
                ✅ Checked In Successfully!
              </p>
              
              <div className="w-full bg-gray-800 rounded-lg p-4 space-y-3">
                {registrationInfo.isLeader ? (
                  <>
                    <div className="flex items-center gap-2">
                      <HiUser className="text-blue-400" />
                      <span className="text-gray-300">Role:</span>
                      <span className="text-white font-semibold">Leader</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiUser className="text-blue-400" />
                      <span className="text-gray-300">Name:</span>
                      <span className="text-white font-semibold">{registrationInfo.leader?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiMail className="text-blue-400" />
                      <span className="text-gray-300">Email:</span>
                      <span className="text-white font-semibold">{registrationInfo.leader?.email}</span>
                    </div>
                    {registrationInfo.teamName && (
                      <div className="flex items-center gap-2">
                        <HiTicket className="text-blue-400" />
                        <span className="text-gray-300">Team:</span>
                        <span className="text-white font-semibold">{registrationInfo.teamName}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <HiUser className="text-blue-400" />
                      <span className="text-gray-300">Role:</span>
                      <span className="text-white font-semibold">Team Member</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiUser className="text-blue-400" />
                      <span className="text-gray-300">Name:</span>
                      <span className="text-white font-semibold">{registrationInfo.scannedMember?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiMail className="text-blue-400" />
                      <span className="text-gray-300">Email:</span>
                      <span className="text-white font-semibold">{registrationInfo.scannedMember?.email}</span>
                    </div>
                    {registrationInfo.teamName && (
                      <div className="flex items-center gap-2">
                        <HiTicket className="text-blue-400" />
                        <span className="text-gray-300">Team:</span>
                        <span className="text-white font-semibold">{registrationInfo.teamName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <HiUser className="text-blue-400" />
                      <span className="text-gray-300">Leader:</span>
                      <span className="text-white font-semibold">{registrationInfo.leader?.name}</span>
                    </div>
                  </>
                )}
                {registrationInfo.teamMembers && registrationInfo.teamMembers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <HiUsers className="text-blue-400" />
                      <span className="text-gray-300 font-semibold">Team Members ({registrationInfo.teamMembers.length}):</span>
                    </div>
                    <div className="space-y-1 ml-6">
                      {registrationInfo.teamMembers.map((member, index) => (
                        <div key={index} className="text-sm text-gray-300">
                          • {member.name} {member.email && `(${member.email})`}
                          {member.attended && <span className="text-green-400 ml-2">✓ Attended</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-gray-400 text-sm text-center">
                Automatically scanning for next attendee...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
          >
            Reset Scanner
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
