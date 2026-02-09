import { useAppStore } from '../store';
import { sendCommand } from '../mqtt';
import { useState } from 'react';

export default function ControlsSidebar() {
  const { 
    controlsSidebarOpen, 
    toggleControlsSidebar, 
    relayState,
    availabilityList
  } = useAppStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  const handleAllLights = async () => {
    console.log('[ControlsSidebar] All Lights - Sending white_all command');
    
    // Step 1: Send white_all command
    await sendCommand('white_all');
    
    // Wait a moment for the first command to be processed
    await delay(200);
    
    // Step 2: Send command to turn rooms 4 & 5 of floor 6 red
    console.log('[ControlsSidebar] Sending command to turn Floor 6, Rooms 4 & 5 RED');
    await sendCommand('floor6_refugee_red', { floor: 6, rooms: [4, 5] });
  };

  const handleAvailability = async () => {
    console.log('[ControlsSidebar] Starting availability mode');
    
    if (availabilityList.length === 0) {
      console.warn('[ControlsSidebar] No availability data loaded!');
      alert('Availability data not loaded. Please refresh the page.');
      return;
    }
    
    setIsProcessing(true);
    setProgress('Initializing...');
    
    try {
      console.log('[ControlsSidebar] Step 1: Sending base GREEN command');
      setProgress('Setting base green...');
      
      await sendCommand('avail_base_green');
      await delay(100);
      
      console.log('[ControlsSidebar] Step 2: Grouping data by floor');
      const floorGroups = new Map<number, Array<{room: number, status: number}>>();
      
      availabilityList.forEach(item => {
        if (!floorGroups.has(item.floor)) {
          floorGroups.set(item.floor, []);
        }
        floorGroups.get(item.floor)!.push({
          room: item.room,
          status: item.status
        });
      });
      
      console.log(`[ControlsSidebar] Grouped into ${floorGroups.size} floors`);
      
      let processedFloors = 0;
      const totalFloors = floorGroups.size;
      
      for (const [floor, rooms] of floorGroups.entries()) {
        const blockedRooms = rooms.filter(r => r.status === 2);
        const soldRooms = rooms.filter(r => r.status === 0);
        
        if (blockedRooms.length > 0 || soldRooms.length > 0) {
          console.log(`[ControlsSidebar] Processing Floor ${floor}: ${blockedRooms.length} blocked, ${soldRooms.length} sold`);
          setProgress(`Floor ${floor}... (${processedFloors + 1}/${totalFloors})`);
          
          await sendCommand('avail_floor_data', {
            floor: floor,
            blocked: blockedRooms.map(r => r.room),
            sold: soldRooms.map(r => r.room)
          });
          
          await delay(150);
        }
        
        processedFloors++;
      }
      
      console.log('[ControlsSidebar] ✅ Availability mode complete');
      setProgress('Complete!');
      await delay(1000);
      
    } catch (error) {
      console.error('[ControlsSidebar] Error:', error);
      alert('Error activating availability mode. Check console.');
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };
  
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <>
      <div className={`controls-sidebar ${controlsSidebarOpen ? 'active' : ''}`}>
        <div className="controls-content">
          <div className="controls-header">
            <h3 className="text-xl font-semibold text-white">LED Controls</h3>
            <button onClick={toggleControlsSidebar} className="close-btn-simple">
              <i data-lucide="x" className="w-6 h-6"></i>
            </button>
          </div>

          <div className="controls-body">
            <div className="control-section">
              <h4 className="section-title">Patterns</h4>
              <div className="control-grid">
                <button onClick={handleAllLights} className="control-btn">
                  All Lights
                </button>
                <button onClick={() => sendCommand('set_all_floors_off')} className="control-btn">
                  All OFF
                </button>
                <button onClick={() => sendCommand('classic_all')} className="control-btn">
                  Classic
                </button>
                <button 
                  onClick={handleAvailability} 
                  className="control-btn availability-btn"
                  disabled={isProcessing}
                >
                  <div className="flex items-center gap-2">
                    <i data-lucide={isProcessing ? 'loader' : 'home'} className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`}></i>
                    <span>{isProcessing ? progress : 'Availability'}</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="control-section">
              <h4 className="section-title">Relays</h4>
              <div className="control-grid">
                <button 
                  onClick={() => sendCommand('relay_toggle', { relay: 'surrounding' })} 
                  className={`control-btn ${relayState.surrounding ? 'active' : ''}`}
                >
                  Surrounding
                </button>
                <button 
                  onClick={() => sendCommand('relay_toggle', { relay: 'terrace' })} 
                  className={`control-btn ${relayState.terrace ? 'active' : ''}`}
                >
                  Terrace
                </button>
              </div>
            </div>
            
            <div className="control-section">
              <h4 className="section-title">Availability Legend</h4>
              <div className="availability-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#00ff00' }}></div>
                  <span className="text-white text-sm">Available</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#ffff00' }}></div>
                  <span className="text-white text-sm">Blocked</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#0064ff' }}></div>
                  <span className="text-white text-sm">Sold</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className={`controls-backdrop ${controlsSidebarOpen ? 'active' : ''}`}
        onClick={toggleControlsSidebar}
      />
      
      <style>{`
        .availability-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: rgba(255, 255, 255, 0.4);
        }
        
        .availability-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }
        
        .availability-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .availability-legend {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.75rem;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .legend-color {
          width: 24px;
          height: 24px;
          border-radius: 0.375rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
}