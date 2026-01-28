'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  HiCheckCircle, HiX, HiCamera, HiQrcode, HiTicket, HiRefresh
} from 'react-icons/hi';

export default function CheckInPage() {
  const router = useRouter();
  const { status } = useSession();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [registrationInfo, setRegistrationInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const startScanner = async () => {
    setError('');
    setIsScanning(true);
    setScannedData(null);
    setIsCheckedIn(false);
    setRegistrationInfo(null);

    setTimeout(() => {
      if (!scannerRef.current) return;

      const html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;

      // Use a square aspect ratio to properly frame the scanner
      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false 
      };
      
      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleScanSuccess(decodedText, html5QrCode);
        },
        (errorMessage) => {}
      ).catch(err => {
        console.error("Scanner Error", err);
        setError("Camera not accessible");
        setIsScanning(false);
      });
    }, 100);
  };

  const handleScanSuccess = async (decodedText, scannerInstance) => {
    setScannedData(decodedText);
    try {
        await scannerInstance.stop();
        scannerInstance.clear();
    } catch(e) {}
    setIsScanning(false);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
        try {
            await html5QrCodeRef.current.stop();
            html5QrCodeRef.current.clear();
        } catch(e) {}
    }
    setIsScanning(false);
  };

  const handleCheckIn = async () => {
    if (!scannedData) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/registration/qrcode/${encodeURIComponent(scannedData)}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Invalid QR');
      }
      
      const registration = await res.json();
      const isLeader = registration.isLeader;
      const member = registration.scannedMember;

      if ((isLeader && registration.checkedIn) || (!isLeader && member?.attended)) {
          throw new Error('Already Checked In');
      }

      const updateBody = isLeader ? { checkedIn: true } : {
          teamMemberAttendance: { memberEmail: member.email, attended: true }
      };

      const uRes = await fetch(`/api/registration/${registration._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      });

      if (!uRes.ok) throw new Error('Update failed');

      const uReg = await uRes.json();
      setRegistrationInfo({
        ...uReg,
        scannedMember: !isLeader ? uReg.teamMembers.find(m => m.email === member.email) : null,
        isLeader
      });
      setIsCheckedIn(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setScannedData(null);
    setIsCheckedIn(false);
    setRegistrationInfo(null);
    setError('');
    startScanner();
  };

  // Cleanup
  useEffect(() => {
    return () => {
        if(html5QrCodeRef.current) {
            try { html5QrCodeRef.current.stop(); } catch(e){}
        }
    };
  }, []);

  if (status === 'loading') return null;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-md mx-auto">
        
        {/* Header */}
        {!isScanning && (
            <div className="text-center mb-8 animate-fadeIn">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <HiQrcode className="text-3xl text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Scan Ticket</h1>
                <p className="text-gray-500 mt-1">Verify attendee entry</p>
            </div>
        )}

        {/* ERROR */}
        {error && (
            <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-center font-medium text-sm animate-shake">
                {error}
                <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
            </div>
        )}

        {/* SCANNER VIEWPORT */}
        {isScanning ? (
            <div className="relative overflow-hidden rounded-[2rem] bg-black shadow-2xl aspect-square animate-scaleIn">
                 <div id="reader" ref={scannerRef} className="w-full h-full"></div>
                 
                 {/* Overlay */}
                 <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                     {/* Frame */}
                     <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                         <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                         <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                         <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                         <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                     </div>
                     <p className="mt-6 text-white/90 font-medium text-sm bg-black/20 backdrop-blur-md px-3 py-1 rounded-full"> Align QR Code </p>
                 </div>

                 {/* Close Button */}
                 <button 
                    onClick={stopScanner}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full text-white transition-all z-50"
                 >
                    <HiX className="text-xl" />
                 </button>
            </div>
        ) : (
             /* IDLE STATE BUTTON */
             !scannedData && !isCheckedIn && (
                <div className="text-center">
                    <button 
                        onClick={startScanner}
                        className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold text-lg hover:scale-[1.02] transition-transform shadow-xl flex items-center justify-center gap-2"
                    >
                        <HiCamera className="text-xl" />
                        Open Scanner
                    </button>
                </div>
             )
        )}

        {/* DETECTED / VERIFY */}
        {scannedData && !isCheckedIn && !isScanning && (
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center animate-fadeInUp">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HiTicket className="text-3xl text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">QR Detected</h3>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-6">
                    <p className="text-xs font-mono text-gray-500 break-all">{scannedData}</p>
                </div>
                <div className="space-y-3">
                    <button 
                        onClick={handleCheckIn}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Verifying...' : 'Check In'}
                    </button>
                    <button 
                        onClick={startScanner}
                        className="w-full py-3 rounded-xl text-gray-400 hover:text-gray-600 font-semibold"
                    >
                        Rescan
                    </button>
                </div>
            </div>
        )}

        {/* SUCCESS */}
        {isCheckedIn && registrationInfo && (
            <div className="bg-white rounded-3xl p-0 shadow-2xl border border-gray-100 overflow-hidden animate-fadeInUp">
                <div className="bg-green-500 p-8 text-center text-white">
                    <HiCheckCircle className="text-6xl mx-auto mb-2" />
                    <h2 className="text-2xl font-bold">Verified</h2>
                </div>
                <div className="p-8 text-center space-y-4">
                    <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${registrationInfo.isLeader ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {registrationInfo.isLeader ? 'Leader' : 'Member'}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {registrationInfo.isLeader ? registrationInfo.leader?.name : registrationInfo.scannedMember?.name}
                        </h3>
                        {registrationInfo.teamName && <p className="text-gray-500 font-medium">{registrationInfo.teamName}</p>}
                    </div>
                    
                    <div className="pt-4 mt-4 border-t border-gray-100">
                         <button 
                            onClick={reset}
                            className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                        >
                            <HiRefresh className="text-lg" /> Scan Next
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

       {/* GLOBAL STYLES FOR VIDEO FIX */}
       <style jsx global>{`
          /* Force video to cover the container */
          #reader video { 
              object-fit: cover !important; 
              width: 100% !important;
              height: 100% !important;
              border-radius: 2rem !important;
          }
      `}</style>
    </div>
  );
}
