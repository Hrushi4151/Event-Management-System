'use client';

import { useState, useEffect } from 'react';
import {
  HiBadgeCheck,
  HiPhotograph,
  HiStar,
  HiPlus,
  HiTrash,
  HiSave,
  HiX,
  HiDownload,
} from 'react-icons/hi';

export default function CompletedEventFeatures({ eventId, eventData, onUpdate, actionLoading, setActionLoading }) {
  const [winners, setWinners] = useState(eventData?.winners || []);
  const [eventPhotos, setEventPhotos] = useState(eventData?.eventPhotos || []);
  const [highlights, setHighlights] = useState(eventData?.highlights || '');
  const [summary, setSummary] = useState(eventData?.summary || '');
  const [testimonials, setTestimonials] = useState(eventData?.testimonials || []);
  const [statistics, setStatistics] = useState(eventData?.statistics || {
    totalParticipants: 0,
    totalTeams: 0,
    totalAttendees: 0,
    averageRating: 0,
  });

  // Sync state with eventData when it changes
  useEffect(() => {
    if (eventData) {
      setWinners(eventData.winners || []);
      setEventPhotos(eventData.eventPhotos || []);
      setHighlights(eventData.highlights || '');
      setSummary(eventData.summary || '');
      setTestimonials(eventData.testimonials || []);
      setStatistics(eventData.statistics || {
        totalParticipants: 0,
        totalTeams: 0,
        totalAttendees: 0,
        averageRating: 0,
      });
    }
  }, [eventData]);

  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingWinner, setEditingWinner] = useState(null);
  const [editingTestimonial, setEditingTestimonial] = useState(null);

  const [newWinner, setNewWinner] = useState({
    position: '',
    teamName: '',
    leaderName: '',
    leaderEmail: '',
    prize: '',
  });

  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: '',
    text: '',
    rating: 5,
  });

  // Convert file to base64
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const base64Photos = await Promise.all(files.map(file => toBase64(file)));
      setEventPhotos([...eventPhotos, ...base64Photos]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    }
  };

  const removePhoto = (index) => {
    setEventPhotos(eventPhotos.filter((_, i) => i !== index));
  };

  const handleAddWinner = () => {
    if (!newWinner.position || !newWinner.teamName) {
      alert('Please fill in position and team name');
      return;
    }
    if (editingWinner !== null) {
      const updated = [...winners];
      updated[editingWinner] = { ...newWinner };
      setWinners(updated);
      setEditingWinner(null);
    } else {
      setWinners([...winners, { ...newWinner }]);
    }
    setNewWinner({ position: '', teamName: '', leaderName: '', leaderEmail: '', prize: '' });
    setShowWinnerModal(false);
  };

  const handleEditWinner = (index) => {
    setEditingWinner(index);
    setNewWinner({ ...winners[index] });
    setShowWinnerModal(true);
  };

  const handleDeleteWinner = (index) => {
    if (confirm('Are you sure you want to delete this winner?')) {
      setWinners(winners.filter((_, i) => i !== index));
    }
  };

  const handleAddTestimonial = () => {
    if (!newTestimonial.name || !newTestimonial.text) {
      alert('Please fill in name and testimonial text');
      return;
    }
    if (editingTestimonial !== null) {
      const updated = [...testimonials];
      updated[editingTestimonial] = { ...newTestimonial };
      setTestimonials(updated);
      setEditingTestimonial(null);
    } else {
      setTestimonials([...testimonials, { ...newTestimonial }]);
    }
    setNewTestimonial({ name: '', role: '', text: '', rating: 5 });
    setShowTestimonialModal(false);
  };

  const handleEditTestimonial = (index) => {
    setEditingTestimonial(index);
    setNewTestimonial({ ...testimonials[index] });
    setShowTestimonialModal(true);
  };

  const handleDeleteTestimonial = (index) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      setTestimonials(testimonials.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    try {
      setActionLoading(true);
      const payload = {
        winners,
        eventPhotos,
        highlights,
        summary,
        testimonials,
        statistics,
      };

      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save completed event features');
      await res.json();

      alert('✅ Completed event features saved successfully!');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('❌ Failed to save completed event features');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <HiBadgeCheck className="text-yellow-400" /> Completed Event Features
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              // Export winners
              if (winners.length > 0) {
                let csv = 'Position,Team Name,Leader Name,Leader Email,Prize\n';
                winners.forEach(winner => {
                  const row = [
                    `"${(winner.position || '').replace(/"/g, '""')}"`,
                    `"${(winner.teamName || '').replace(/"/g, '""')}"`,
                    `"${(winner.leaderName || '').replace(/"/g, '""')}"`,
                    `"${(winner.leaderEmail || '').replace(/"/g, '""')}"`,
                    `"${(winner.prize || '').replace(/"/g, '""')}"`,
                  ].join(',');
                  csv += row + '\n';
                });
                
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `winners_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                alert('No winners to export');
              }
            }}
            disabled={winners.length === 0}
            className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 shadow-md transition duration-200 flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            <HiDownload /> Export Winners
          </button>
          <button
            onClick={() => {
              // Export testimonials
              if (testimonials.length > 0) {
                let csv = 'Name,Role,Rating,Testimonial\n';
                testimonials.forEach(testimonial => {
                  const row = [
                    `"${(testimonial.name || '').replace(/"/g, '""')}"`,
                    `"${(testimonial.role || '').replace(/"/g, '""')}"`,
                    testimonial.rating || 0,
                    `"${(testimonial.text || '').replace(/"/g, '""')}"`,
                  ].join(',');
                  csv += row + '\n';
                });
                
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `testimonials_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                alert('No testimonials to export');
              }
            }}
            disabled={testimonials.length === 0}
            className="bg-purple-600 px-4 py-2 rounded-md hover:bg-purple-700 shadow-md transition duration-200 flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            <HiDownload /> Export Testimonials
          </button>
          <button
            onClick={handleSave}
            disabled={actionLoading}
            className="bg-green-600 px-4 py-2 rounded-md hover:bg-green-700 shadow-md transition duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <HiSave /> Save All Changes
          </button>
        </div>
      </div>

      {/* Winners Section */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <HiBadgeCheck className="text-yellow-400" /> Winners
          </h3>
          <button
            onClick={() => {
              setEditingWinner(null);
              setNewWinner({ position: '', teamName: '', leaderName: '', leaderEmail: '', prize: '' });
              setShowWinnerModal(true);
            }}
            className="bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
          >
            <HiPlus /> Add Winner
          </button>
        </div>
        {winners.length === 0 ? (
          <p className="text-gray-400 text-sm">No winners added yet.</p>
        ) : (
          <div className="space-y-3">
            {winners.map((winner, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {winner.position}
                    </span>
                    <span className="text-white font-semibold">{winner.teamName}</span>
                  </div>
                  {winner.leaderName && (
                    <p className="text-gray-300 text-sm">Leader: {winner.leaderName}</p>
                  )}
                  {winner.leaderEmail && (
                    <p className="text-gray-400 text-xs">Email: {winner.leaderEmail}</p>
                  )}
                  {winner.prize && (
                    <p className="text-yellow-400 text-sm mt-1">🏆 Prize: {winner.prize}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditWinner(index)}
                    className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteWinner(index)}
                    className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    <HiTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Photos Section */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <HiPhotograph className="text-blue-400" /> Event Photos
        </h3>
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Upload Photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
        {eventPhotos.length === 0 ? (
          <p className="text-gray-400 text-sm">No photos uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {eventPhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Event photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <HiX />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Highlights Section */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Event Highlights</h3>
        <textarea
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          placeholder="Enter key highlights from the event..."
          rows={4}
          className="w-full bg-gray-800 p-3 rounded-md text-white border border-gray-600"
        />
      </div>

      {/* Summary Section */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Event Summary</h3>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Enter a detailed summary of the event..."
          rows={6}
          className="w-full bg-gray-800 p-3 rounded-md text-white border border-gray-600"
        />
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <HiStar className="text-yellow-400" /> Testimonials
          </h3>
          <button
            onClick={() => {
              setEditingTestimonial(null);
              setNewTestimonial({ name: '', role: '', text: '', rating: 5 });
              setShowTestimonialModal(true);
            }}
            className="bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
          >
            <HiPlus /> Add Testimonial
          </button>
        </div>
        {testimonials.length === 0 ? (
          <p className="text-gray-400 text-sm">No testimonials added yet.</p>
        ) : (
          <div className="space-y-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    {testimonial.role && (
                      <p className="text-gray-400 text-sm">{testimonial.role}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <HiStar
                        key={i}
                        className={i < testimonial.rating ? 'text-yellow-400' : 'text-gray-600'}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-3">"{testimonial.text}"</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTestimonial(index)}
                    className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTestimonial(index)}
                    className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    <HiTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Section */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Event Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Total Participants</label>
            <input
              type="number"
              value={statistics.totalParticipants || 0}
              onChange={(e) => setStatistics({ ...statistics, totalParticipants: parseInt(e.target.value) || 0 })}
              className="w-full bg-gray-800 p-2 rounded-md text-white border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Total Teams</label>
            <input
              type="number"
              value={statistics.totalTeams || 0}
              onChange={(e) => setStatistics({ ...statistics, totalTeams: parseInt(e.target.value) || 0 })}
              className="w-full bg-gray-800 p-2 rounded-md text-white border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Total Attendees</label>
            <input
              type="number"
              value={statistics.totalAttendees || 0}
              onChange={(e) => setStatistics({ ...statistics, totalAttendees: parseInt(e.target.value) || 0 })}
              className="w-full bg-gray-800 p-2 rounded-md text-white border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Average Rating</label>
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={statistics.averageRating || 0}
              onChange={(e) => setStatistics({ ...statistics, averageRating: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-800 p-2 rounded-md text-white border border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      {showWinnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {editingWinner !== null ? 'Edit Winner' : 'Add Winner'}
              </h3>
              <button onClick={() => setShowWinnerModal(false)} className="text-gray-400 hover:text-white">
                <HiX className="text-2xl" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Position *</label>
                <input
                  type="text"
                  value={newWinner.position}
                  onChange={(e) => setNewWinner({ ...newWinner, position: e.target.value })}
                  placeholder="e.g., 1st Place, 2nd Place"
                  className="w-full bg-gray-700 p-2 rounded-md text-white border border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Team Name *</label>
                <input
                  type="text"
                  value={newWinner.teamName}
                  onChange={(e) => setNewWinner({ ...newWinner, teamName: e.target.value })}
                  className="w-full bg-gray-700 p-2 rounded-md text-white border border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Leader Name</label>
                <input
                  type="text"
                  value={newWinner.leaderName}
                  onChange={(e) => setNewWinner({ ...newWinner, leaderName: e.target.value })}
                  className="w-full bg-gray-700 p-2 rounded-md text-white border border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Leader Email</label>
                <input
                  type="email"
                  value={newWinner.leaderEmail}
                  onChange={(e) => setNewWinner({ ...newWinner, leaderEmail: e.target.value })}
                  className="w-full bg-gray-700 p-2 rounded-md text-white border border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Prize</label>
                <input
                  type="text"
                  value={newWinner.prize}
                  onChange={(e) => setNewWinner({ ...newWinner, prize: e.target.value })}
                  placeholder="e.g., $1000, Trophy, Certificate"
                  className="w-full bg-gray-700 p-2 rounded-md text-white border border-gray-600"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWinnerModal(false)}
                className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWinner}
                className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingWinner !== null ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Modal */}
      {showTestimonialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {editingTestimonial !== null ? 'Edit Testimonial' : 'Add Testimonial'}
              </h3>
              <button onClick={() => setShowTestimonialModal(false)} className="text-gray-400 hover:text-white">
                <HiX className="text-2xl" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={newTestimonial.name}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                  className="w-full bg-gray-700 p-2 rounded-md text-white border border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Role</label>
                <input
                  type="text"
                  value={newTestimonial.role}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                  placeholder="e.g., Participant, Organizer, Judge"
                  className="w-full bg-gray-700 p-2 rounded-md text-white border border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Testimonial *</label>
                <textarea
                  value={newTestimonial.text}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, text: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-700 p-2 rounded-md text-white border border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newTestimonial.rating}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value) || 5 })}
                  className="w-full bg-gray-700 p-2 rounded-md text-white border border-gray-600"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTestimonialModal(false)}
                className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTestimonial}
                className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingTestimonial !== null ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
