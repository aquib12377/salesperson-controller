import { useEffect, useState } from 'react';
import { useAppStore } from '../store';

interface Props { active: boolean; }

export default function AdminPage({ active }: Props) {
  const { 
    floors, 
    availability, 
    csvLoaded,
    updateAvailability,
    setPage,
    displayName,
    logout
  } = useAppStore();

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (active && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, [active]);

    const handleLogout = () => {
    logout(); // Use the store function
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return '#0064ff'; // Sold - Blue
      case 1: return '#00ff00'; // Available - Green
      case 2: return '#ffff00'; // Blocked - Yellow
      default: return '#999999';
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Sold';
      case 1: return 'Available';
      case 2: return 'Blocked';
      default: return 'Unknown';
    }
  };

  const handleStatusChange = async (floor: number, room: number, newStatus: number) => {
    console.log(`[AdminPage] Updating Floor ${floor}, Room ${room} to status ${newStatus}`);
    
    // Update in store
    updateAvailability(floor, room, newStatus);
    
    // Show saving status
    setSaveStatus('saving');
    
    try {
      // Send to backend API to update CSV
      const response = await fetch('/api/update-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building_id: 1,
          floor_id: floor,
          room_id: room + 2, // Convert UI room (1-6) to CSV room (3-8)
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update CSV');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('[AdminPage] Error updating CSV:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const getRoomStatus = (floor: number, room: number): number => {
    const key = `${floor}-${room}`;
    return availability.get(key) ?? 1; // Default to available
  };

  // Filter residential floors (3-15)
  const residentialFloors = floors.filter(f => f.id >= 3 && f.id <= 15);

  if (!active) return null;

  return (
    <div className="page active min-h-screen overflow-auto">
      {/* Header */}
      <div className="context-bar sticky top-0 z-50">
        <div className="breadcrumb">
          <div className="flex items-center gap-3">
            <i data-lucide="shield-check" className="w-6 h-6"></i>
            <span className="text-lg font-semibold">Admin Panel</span>
          </div>
        </div>
        <div className="context-actions">
          <div className="text-white/80 text-sm mr-3">
            {displayName}
          </div>
          <button onClick={handleLogout} className="cast-btn-top">
            <i data-lucide="log-out" className="w-5 h-5"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Save Status Banner */}
        {saveStatus !== 'idle' && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            saveStatus === 'saving' ? 'bg-blue-500/20 border border-blue-500/50' :
            saveStatus === 'success' ? 'bg-green-500/20 border border-green-500/50' :
            'bg-red-500/20 border border-red-500/50'
          }`}>
            <i data-lucide={
              saveStatus === 'saving' ? 'loader' : 
              saveStatus === 'success' ? 'check-circle' : 'alert-circle'
            } className={`w-5 h-5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`}></i>
            <span className="text-white">
              {saveStatus === 'saving' ? 'Saving changes...' :
               saveStatus === 'success' ? 'Changes saved successfully!' :
               'Error saving changes. Please try again.'}
            </span>
          </div>
        )}

        {/* Status Legend */}
        <div className="glass rounded-xl p-4 mb-6">
          <h3 className="text-white font-semibold mb-3">Status Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: '#00ff00' }}></div>
              <span className="text-white text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: '#0064ff' }}></div>
              <span className="text-white text-sm">Sold</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: '#ffff00' }}></div>
              <span className="text-white text-sm">Blocked</span>
            </div>
          </div>
        </div>

        {/* Floor Selection */}
        <div className="glass rounded-xl p-4 md:p-6 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Select Floor</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {residentialFloors.map(floor => (
              <button
                key={floor.id}
                onClick={() => setSelectedFloor(floor.id)}
                className={`p-4 rounded-lg font-semibold transition-all ${
                  selectedFloor === floor.id
                    ? 'bg-purple-600 text-white scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {floor.label}
              </button>
            ))}
          </div>
        </div>

        {/* Room Grid */}
        {selectedFloor && (
          <div className="glass rounded-xl p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
              {floors.find(f => f.id === selectedFloor)?.label} - Room Availability
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(room => {
                const status = getRoomStatus(selectedFloor, room);
                const roomNumber = `${selectedFloor - 2}${room.toString().padStart(2, '0')}`;
                
                return (
                  <div
                    key={room}
                    className="bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-bold text-lg">Room {roomNumber}</h3>
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white/30"
                        style={{ backgroundColor: getStatusColor(status) }}
                      ></div>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleStatusChange(selectedFloor, room, 1)}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          status === 1
                            ? 'bg-green-600 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <i data-lucide="check-circle" className="w-4 h-4"></i>
                          <span>Available</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange(selectedFloor, room, 0)}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          status === 0
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <i data-lucide="dollar-sign" className="w-4 h-4"></i>
                          <span>Sold</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange(selectedFloor, room, 2)}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          status === 2
                            ? 'bg-yellow-600 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <i data-lucide="lock" className="w-4 h-4"></i>
                          <span>Blocked</span>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!selectedFloor && (
          <div className="glass rounded-xl p-8 text-center">
            <i data-lucide="arrow-up" className="w-12 h-12 text-white/30 mx-auto mb-3"></i>
            <p className="text-white/50">Select a floor to manage room availability</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}