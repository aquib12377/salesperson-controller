import { useAppStore } from '../store';
import { sendCommand } from '../mqtt';

export default function ControlsSidebar() {
  const { controlsSidebarOpen, toggleControlsSidebar, relayState } = useAppStore();

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
                <button onClick={() => sendCommand('white_all')} className="control-btn">All Lights</button>
                <button onClick={() => sendCommand('set_all_floors_off')} className="control-btn">All OFF</button>
                <button onClick={() => sendCommand('classic_all')} className="control-btn">Classic</button>
                <button onClick={() => sendCommand('availability_filter', { status: 'available' })} className="control-btn">Available</button>
              </div>
            </div>

            <div className="control-section">
              <h4 className="section-title">Relays</h4>
              <div className="control-grid">
                <button onClick={() => sendCommand('relay_toggle', { relay: 'surrounding' })} className={`control-btn ${relayState.surrounding ? 'active' : ''}`}>Surrounding</button>
                <button onClick={() => sendCommand('relay_toggle', { relay: 'terrace' })} className={`control-btn ${relayState.terrace ? 'active' : ''}`}>Terrace</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className={`controls-backdrop ${controlsSidebarOpen ? 'active' : ''}`}
        onClick={toggleControlsSidebar}
      />
    </>
  );
}