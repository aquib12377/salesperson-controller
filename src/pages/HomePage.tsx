import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { getClient, subscribe, onMessage, recordAck, startHeartbeat, stopHeartbeat, isDeviceAlive, t } from '../mqtt';
import AmenitiesControl from '../components/AmenitiesControl';

interface Props { active: boolean; }

export default function HomePage({ active }: Props) {
  const { selectFloor, toggleControlsSidebar, displayName, setConnected, setDeviceAlive, setPage,logout   } = useAppStore();
  const [showAmenities, setShowAmenities] = useState(false);

  // MQTT connection setup
  useEffect(() => {
    let stopHb: (() => void) | null = null;
    let ageTimer: NodeJS.Timeout | null = null;

    (async () => {
      const c = await getClient();

      const onConnect = () => {
        console.log('[HomePage] MQTT connected');
        setConnected(true);
        
        subscribe(t('ui/ack'));
        subscribe(t('cast/state'));
        subscribe(t('relay/state'));
        subscribe(t('control/state'));
        
        stopHb = startHeartbeat(5000);
      };

      const onClose = () => {
        console.log('[HomePage] MQTT disconnected');
        setConnected(false);
        setDeviceAlive(false);
        if (stopHb) stopHb();
      };

      c.on('connect', onConnect);
      c.on('close', onClose);

      onMessage((topic, msg) => {
        const s = msg.toString();
        
        if (topic === t('ui/ack')) {
          recordAck();
          setDeviceAlive(isDeviceAlive());
          return;
        }
        
        try {
          const payload = JSON.parse(s);
          console.log('[HomePage] Message:', topic, payload);
        } catch (e) {
          console.error('[HomePage] Parse error:', e);
        }
      });

      if (c.connected) {
        onConnect();
      }
    })();

    ageTimer = setInterval(() => {
      setDeviceAlive(isDeviceAlive());
    }, 2000);

    return () => {
      if (ageTimer) clearInterval(ageTimer);
      if (stopHb) stopHb();
      
      try {
        const client = (window as any).__mqtt_client_ref;
        if (client) {
          client.off?.('connect');
          client.off?.('close');
        }
      } catch {
        // ignore
      }
    };
  }, [setConnected, setDeviceAlive]);

  useEffect(() => {
    if (active && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, [active]);

const handleLogout = () => {
    logout(); // Use the store function
  };

  if (!active) return null;

  return (
    <div className="page active min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <img 
            src="/logo.png" 
            alt="JP Logo" 
            className="h-16 md:h-24 w-auto mx-auto mb-4 md:mb-6" 
            onError={(e) => (e.currentTarget.style.display = 'none')} 
          />
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 md:mb-3">JP Infra</h1>
          <p className="text-white/70 text-base md:text-lg">Interactive Building Visualization</p>
        </div>

        <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-12 max-w-2xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 md:mb-6">Control Panel</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
            <button onClick={() => selectFloor(1)} className="action-card">
              <i data-lucide="map" className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3"></i>
              <span className="text-lg md:text-xl font-semibold">Floor Map</span>
              <span className="text-xs md:text-sm text-white/70 mt-1">Explore floors & rooms</span>
            </button>
            
            <button onClick={toggleControlsSidebar} className="action-card">
              <i data-lucide="sliders" className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3"></i>
              <span className="text-lg md:text-xl font-semibold">LED Controls</span>
              <span className="text-xs md:text-sm text-white/70 mt-1">Patterns & settings</span>
            </button>

            <button onClick={() => setShowAmenities(true)} className="action-card">
              <i data-lucide="building-2" className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3"></i>
              <span className="text-lg md:text-xl font-semibold">Amenities</span>
              <span className="text-xs md:text-sm text-white/70 mt-1">16th Floor Facilities</span>
            </button>

            <button onClick={handleLogout} className="action-card bg-red-600/20 border-red-600/40 hover:bg-red-600/30">
              <i data-lucide="log-out" className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3"></i>
              <span className="text-lg md:text-xl font-semibold">Logout</span>
              <span className="text-xs md:text-sm text-white/70 mt-1">Exit system</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-white/20">
            <div className="text-white/80 text-xs md:text-sm">
              Logged in: <span className="font-semibold text-white">{displayName}</span>
            </div>
          </div>
        </div>
      </div>

      <AmenitiesControl isOpen={showAmenities} onClose={() => setShowAmenities(false)} />
    </div>
  );
}