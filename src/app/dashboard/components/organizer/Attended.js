'use client';

import { useState, useEffect } from 'react';
import { HiDownload, HiCheck, HiUserGroup, HiCheckCircle, HiX, HiMail, HiTicket, HiUsers, HiCalendar, HiXCircle } from 'react-icons/hi';
import { QRCodeSVG } from 'qrcode.react';
import { TruncatedAddress } from '../TruncatedAddress';

export default function AttendedPage({ registrations, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState([]);
  const [updating, setUpdating] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [modalMembers, setModalMembers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Transform registrations into the format expected by the component
  useEffect(() => {
    if (!registrations || registrations.length === 0) {
      setData([]);
      return;
    }

    const transformedData = registrations.map((reg) => {
      const members = [
        {
          name: reg.leader?.name || reg.name || 'N/A',
          email: reg.leader?.email || reg.email || 'N/A',
          attended: reg.checkedIn || false,
          registrationId: reg.id || reg.registrationId || reg._id,
          isLeader: true,
          qrCode: reg.qrCode, // Leader's QR code
        },
        ...(reg.teamMembers || []).map((member) => ({
          name: member.name,
          email: member.email,
          profile: member.profile || '',
          attended: member.attended || false, // Individual attendance tracking
          registrationId: reg.id || reg.registrationId || reg._id,
          isLeader: false,
          qrCode: member.qrCode, // Individual member QR code
        })),
      ];

      return {
        teamName: reg.teamName || 'Individual',
        members,
        registrationId: reg.id || reg.registrationId || reg._id,
        event: reg.event,
        status: reg.status,
        qrCode: reg.qrCode,
        createdAt: reg.createdAt,
      };
    });

    setData(transformedData);
  }, [registrations]);

  const handleToggleAttendance = async (teamIndex, memberIndex) => {
    const team = data[teamIndex];
    const member = team.members[memberIndex];
    const registrationId = member.registrationId;

    // For leader (index 0), update the registration's checkedIn status
    if (memberIndex === 0) {
      const newCheckedInStatus = !member.attended;
      setUpdating({ [registrationId]: true });

      try {
        // First, update leader's checkedIn status
        const res = await fetch(`/api/registration/${registrationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ checkedIn: newCheckedInStatus }),
        });

        if (!res.ok) {
          throw new Error('Failed to update attendance');
        }

        // Then, update all team members' attendance in the database
        const team = data[teamIndex];
        if (team.members.length > 1) {
          const teamMemberUpdates = team.members
            .filter((m, idx) => idx > 0) // Skip leader
            .map((m) => ({
              memberEmail: m.email,
              attended: newCheckedInStatus,
            }));

          // Update each team member's attendance
          for (const update of teamMemberUpdates) {
            await fetch(`/api/registration/${registrationId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                teamMemberAttendance: update,
              }),
            });
          }
        }

        // Update local state for leader and all team members
        const updated = [...data];
        updated[teamIndex].members[memberIndex].attended = newCheckedInStatus;
        // When leader is checked in, mark all team members as attended too
        if (newCheckedInStatus) {
          updated[teamIndex].members.forEach((m, idx) => {
            if (idx > 0) m.attended = true;
          });
        } else {
          // When leader is unchecked, uncheck all team members
          updated[teamIndex].members.forEach((m, idx) => {
            if (idx > 0) m.attended = false;
          });
        }
        setData(updated);
        
        if (selectedTeam && selectedTeam.index === teamIndex) {
          setSelectedTeam({ ...updated[teamIndex], index: teamIndex });
        }

        // Refresh parent component data
        if (onRefresh) {
          onRefresh();
        }
      } catch (err) {
        console.error('Toggle attendance error:', err);
        alert('Failed to update attendance');
      } finally {
        setUpdating({ [registrationId]: false });
      }
    } else {
      // For team members, save attendance to database
      const newAttendedStatus = !member.attended;
      setUpdating({ [`${registrationId}-${member.email}`]: true });

      try {
        const res = await fetch(`/api/registration/${registrationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamMemberAttendance: {
              memberEmail: member.email,
              attended: newAttendedStatus,
            },
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to update team member attendance');
        }

        // Update local state
        const updated = [...data];
        updated[teamIndex].members[memberIndex].attended = newAttendedStatus;
        setData(updated);

        if (selectedTeam && selectedTeam.index === teamIndex) {
          setSelectedTeam({ ...updated[teamIndex], index: teamIndex });
        }

        // Refresh parent component data
        if (onRefresh) {
          onRefresh();
        }
      } catch (err) {
        console.error('Toggle team member attendance error:', err);
        alert('Failed to update team member attendance');
      } finally {
        setUpdating({ [`${registrationId}-${member.email}`]: false });
      }
    }
  };

  const handleTeamClick = (team, index) => {
    setSelectedTeam({ ...team, index });
    setModalMembers(team.members.map(m => ({ ...m })));
  };

  const toggleModalMemberAttendance = (idx) => {
    const updatedMembers = [...modalMembers];
    const newStatus = !updatedMembers[idx].attended;
    
    // Consistent with handleToggleAttendance: Leader toggle affects everyone
    if (idx === 0) {
      updatedMembers.forEach(m => m.attended = newStatus);
    } else {
      updatedMembers[idx].attended = newStatus;
    }
    
    setModalMembers(updatedMembers);
  };

  const handleSaveBatchChanges = async () => {
    if (!selectedTeam) return;
    setIsSaving(true);
    const originalTeam = data[selectedTeam.index];
    const registrationId = selectedTeam.registrationId;

    try {
      // 1. Handle Leader Update (index 0)
      if (modalMembers[0].attended !== originalTeam.members[0].attended) {
        await fetch(`/api/registration/${registrationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkedIn: modalMembers[0].attended }),
        });
        
        // Note: The API for leader checkedIn typically handles team members too,
        // but for safety in batch mode, we explicitly check members next if they differ from what the leader set.
      }

      // 2. Handle Individual Member Updates (index 1+)
      // Only call API if final status in modal differs from what the server would have (based on leader logic or original status)
      for (let i = 1; i < modalMembers.length; i++) {
        const member = modalMembers[i];
        const originalMember = originalTeam.members[i];
        
        // If it was changed in the modal manually
        if (member.attended !== originalMember.attended) {
            await fetch(`/api/registration/${registrationId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                teamMemberAttendance: {
                  memberEmail: member.email,
                  attended: member.attended,
                },
              }),
            });
        }
      }

      // Update local state and UI
      const updatedData = [...data];
      updatedData[selectedTeam.index].members = modalMembers;
      setData(updatedData);

      if (onRefresh) onRefresh();
      setSelectedTeam(null);
    } catch (err) {
      console.error('Batch update error:', err);
      alert('Failed to save some changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTeamExpand = (teamIndex) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamIndex]: !prev[teamIndex],
    }));
  };

  const handleCSVDownload = () => {
    let csv = 'Team Name,Name,Email,Role,Status,QR Code,Registration Date\n';
    data.forEach((team) => {
      team.members.forEach((member) => {
        const row = [
          `"${(team.teamName || 'Individual').replace(/"/g, '""')}"`,
          `"${(member.name || 'N/A').replace(/"/g, '""')}"`,
          `"${(member.email || 'N/A').replace(/"/g, '""')}"`,
          member.isLeader ? 'Leader' : 'Member',
          member.attended ? 'Attended' : 'Not Attended',
          `"${(member.qrCode || '').replace(/"/g, '""')}"`,
          team.createdAt ? new Date(team.createdAt).toLocaleDateString() : '',
        ].join(',');
        csv += row + '\n';
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.visibility = 'hidden';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredData = data
  .filter(team =>
    team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.members.some(
      (m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )
  .map((team) => ({
    ...team,
    members: team.members.filter(
      (m) =>
        team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  }));


  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-blue-200 shadow-xl shadow-blue-500/5">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] flex items-center gap-3 tracking-tight">
            <span className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30"><HiUserGroup /></span>
            Attendee Management
          </h1>
          <p className="text-[#64748B] mt-2 font-medium flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
             Track and manage real-time event participation
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-101 text-blue-700 text-xs font-bold uppercase tracking-widest">
            💡 Tap &quot;Mark Attended&quot; to verify presence
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full max-w-md group">
          <input
            type="text"
            placeholder="Search by participant name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 text-[#0F172A] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm placeholder-gray-400 font-medium"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
             </svg>
          </span>
        </div>
        <button
          onClick={handleCSVDownload}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-blue-100 text-[#2563EB] hover:bg-blue-50 rounded-2xl font-black text-sm transition-all shadow-sm active:scale-95"
        >
          <HiDownload className="text-xl" />
          EXPORT TO CSV
        </button>
      </div>

      <div className="space-y-6">
      {filteredData.map(
        (team, teamIndex) =>
          team.members.length > 0 && (
            <div
              key={team.teamName}
              className="bg-white rounded-3xl border border-blue-200 shadow-xl shadow-blue-500/5 overflow-hidden group"
            >
              {/* Team Header */}
              <div 
                className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-6 cursor-pointer hover:bg-white transition-colors"
                onClick={() => toggleTeamExpand(teamIndex)}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                     <HiUserGroup className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#0F172A] tracking-tight flex items-center gap-2">
                        {team.teamName}
                        {team.status === 'Accepted' && <HiCheckCircle className="text-green-500 text-sm" />}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            {team.members.length} Members
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-green-500">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {team.members.filter(m => m.attended).length} Present
                        </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Team wide Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Team index and 0 for leader (which triggers team update)
                        handleToggleAttendance(teamIndex, 0);
                      }}
                      disabled={updating[team.registrationId]}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ${
                        team.members[0].attended
                          ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                          : 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20 shadow-lg'
                      }`}
                    >
                      {updating[team.registrationId] ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                      ) : team.members[0].attended ? (
                        <>UNMARK ALL</>
                      ) : (
                        <>MARK ALL ATTENDED</>
                      )}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleTeamClick(team, teamIndex);
                        }}
                        className="px-4 py-2 bg-white border border-gray-200 text-[#0F172A] hover:bg-[#0F172A] hover:text-white hover:border-[#0F172A] rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                    >
                        Detailed View
                    </button>
                    <div className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 transition-transform duration-300 ${expandedTeams[teamIndex] ? 'rotate-180' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4.001 4a1 1 0 01-1.415 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
              </div>
              
              {/* Expandable Info Panel (Refined Layout) */}
              {expandedTeams[teamIndex] && (
                <div className="px-8 py-8 bg-[#F8FAFC] border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch animate-fadeIn">
                   {/* Left: Team Leader Info */}
                   <div className="md:col-span-5 flex items-center gap-4 p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm group/leader">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl shadow-inner group-hover/leader:bg-blue-600 group-hover/leader:text-white transition-all">
                        {team.members[0].name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Team Leader
                         </p>
                         <p className="text-base font-black text-[#0F172A] racking-tight tracking-tight">{team.members[0].name}</p>
                         <p className="text-[10px] font-medium text-gray-400 italic">{team.members[0].email}</p>
                      </div>
                   </div>

                   {/* Middle: Registration Status (Compact) */}
                   <div className="md:col-span-3 flex items-center gap-4 p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                      <div className={`p-3 rounded-xl ${
                          team.status === 'Accepted' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        <HiCheckCircle className="text-xl" />
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Status</p>
                         <p className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border w-fit ${
                             team.status === 'Accepted' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-yellow-50 border-yellow-200 text-yellow-600'
                         }`}>{team.status}</p>
                      </div>
                   </div>

                   {/* Right: Team QR ID (Consolidated) */}
                   {team.qrCode && (
                       <div className="md:col-span-4 flex items-center justify-between p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                           <div className="space-y-1">
                               <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Digital Access ID</p>
                               <p className="text-[9px] font-mono text-gray-400 truncate max-w-[100px]">{team.qrCode}</p>
                           </div>
                           <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 hover:scale-[1.6] hover:shadow-2xl transition-all cursor-zoom-in origin-right z-10">
                              <QRCodeSVG value={team.qrCode} size={45} level="H" includeMargin={false} />
                           </div>
                       </div>
                   )}
                </div>
              )}
            </div>
          )
      )}
      </div>

      {filteredData.every((team) => team.members.length === 0) && (
        <p className="text-center text-gray-400">No attendees found for this search.</p>
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-white/20">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <HiUserGroup className="text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">
                    {selectedTeam.teamName}
                  </h2>
                  <p className="text-xs text-[#64748B] font-bold uppercase tracking-widest mt-0.5">Team Overview & Batch Updates</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-500 hover:shadow-sm transition-all"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              {/* Event Context Card (Prominent) */}
              {selectedTeam.event && (
                <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden group">
                  <HiCalendar className="absolute -right-6 -bottom-6 text-9xl text-white/10 group-hover:scale-110 transition-transform" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest">Active Event</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedTeam.event.title}</h3>
                      {selectedTeam.event.location && (
                        <p className="text-sm text-blue-100 font-medium mt-2 flex items-center gap-2">
                          <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs">📍</span>
                          <TruncatedAddress address={selectedTeam.event.location} maxLength={60} />
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 pt-2">
                       <div className="space-y-0.5">
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Team ID</p>
                          <p className="text-xs font-mono opacity-80">{selectedTeam.registrationId.slice(-8)}</p>
                       </div>
                       <div className="w-px h-8 bg-white/10"></div>
                       <div className="space-y-0.5">
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Status</p>
                          <p className="text-xs font-black uppercase tracking-widest">{selectedTeam.status}</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Management */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Participant Verification</h3>
                    <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest">
                       <span className="text-green-500 px-3 py-1 bg-green-50 rounded-lg border border-green-100 italic">
                          Staging: {modalMembers.filter(m => m.attended).length} Present
                       </span>
                    </div>
                </div>
                
                <div className="space-y-3">
                  {modalMembers.map((member, idx) => {
                    const originalAttended = data[selectedTeam.index].members[idx].attended;
                    const hasChanged = member.attended !== originalAttended;
                    
                    return (
                        <div
                          key={member.email}
                          className={`group p-5 rounded-[1.5rem] flex items-center justify-between transition-all border-2 ${
                            hasChanged 
                              ? 'bg-blue-50/30 border-blue-200 shadow-md' 
                              : 'bg-white border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow-inner transition-transform group-hover:scale-110 ${
                                 idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'
                             }`}>
                               {idx === 0 ? 'L' : (member.name?.charAt(0) || '?').toUpperCase()}
                             </div>
                             <div className="space-y-0.5">
                               <p className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
                                 {member.name}
                                 {idx === 0 && <span className="text-[8px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Team Lead</span>}
                                 {hasChanged && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
                               </p>
                               <p className="text-[11px] text-[#64748B] flex items-center gap-1.5 font-medium italic opacity-60">
                                 {member.email}
                               </p>
                             </div>
                          </div>
                          <button
                            onClick={() => toggleModalMemberAttendance(idx)}
                            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border-2 shadow-sm transition-all flex items-center gap-2 ${
                              member.attended
                                ? 'bg-white border-red-100 text-red-600 hover:bg-red-50'
                                : 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                             {member.attended ? <>UNMARK</> : <>MARK ATTENDED</>}
                          </button>
                        </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-8 py-4 text-gray-400 hover:text-gray-600 text-xs font-black tracking-widest uppercase rounded-2xl transition-all"
              >
                CANCEL CHANGES
              </button>
              <button
                onClick={handleSaveBatchChanges}
                disabled={isSaving || !modalMembers.some((m, idx) => m.attended !== data[selectedTeam.index].members[idx].attended)}
                className="px-10 py-4 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-xs font-black tracking-widest uppercase rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-3"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    SAVING UPDATES...
                  </>
                ) : (
                  <>SAVE & SYNC CHANGES</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
