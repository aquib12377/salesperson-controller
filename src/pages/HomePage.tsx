import { useEffect } from 'react';
import { useAppStore } from '../store';
import { getClient, subscribe, onMessage, recordAck, startHeartbeat, stopHeartbeat, isDeviceAlive, t } from '../mqtt';

interface Props { active: boolean; }

export default function HomePage({ active }: Props) {
  const { selectFloor, toggleControlsSidebar, displayName, setConnected, setDeviceAlive } = useAppStore();

  // MQTT connection setup
  useEffect(() => {
    let stopHb: (() => void) | null = null;
    let ageTimer: NodeJS.Timeout | null = null;

    (async () => {
      const c = await getClient();

      const onConnect = () => {
        console.log('[HomePage] MQTT connected');
        setConnected(true);
        
        // Subscribe to topics after connection is established
        subscribe(t('ui/ack'));
        subscribe(t('cast/state'));
        subscribe(t('relay/state'));
        subscribe(t('control/state'));
        
        // Start heartbeat
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

      // Message handler
      onMessage((topic, msg) => {
        const s = msg.toString();
        
        if (topic === t('ui/ack')) {
          recordAck();
          setDeviceAlive(isDeviceAlive());
          return;
        }
        
        // Handle other topics (cast/state, relay/state, control/state)
        try {
          const payload = JSON.parse(s);
          console.log('[HomePage] Message:', topic, payload);
          
          // Add your message handling logic here based on topic
          // For example:
          // if (topic === t('cast/state')) { ... }
          // if (topic === t('relay/state')) { ... }
          
        } catch (e) {
          console.error('[HomePage] Parse error:', e);
        }
      });

      // If already connected, trigger onConnect manually
      if (c.connected) {
        onConnect();
      }
    })();

    // Device alive checker
    ageTimer = setInterval(() => {
      setDeviceAlive(isDeviceAlive());
    }, 2000);

    return () => {
      if (ageTimer) clearInterval(ageTimer);
      if (stopHb) stopHb();
      
      // Clean up event listeners
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

  if (!active) return null;

  return (
    <div className="page active min-h-screen flex items-center justify-center">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <img 
            src="/logo.png" 
            alt="JP Logo" 
            className="h-24 w-auto mx-auto mb-6" 
            onError={(e) => (e.currentTarget.style.display = 'none')} 
          />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">JP Infra</h1>
          <p className="text-white/70 text-lg">Interactive Building Visualization</p>
        </div>

        <div className="glass rounded-3xl p-8 md:p-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-white mb-6">Control Panel</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button onClick={() => selectFloor(1)} className="action-card">
              <i data-lucide="map" className="w-8 h-8 mb-3"></i>
              <span className="text-xl font-semibold">Floor Map</span>
              <span className="text-sm text-white/70 mt-1">Explore floors & rooms</span>
            </button>
            
            <button onClick={toggleControlsSidebar} className="action-card">
              <i data-lucide="sliders" className="w-8 h-8 mb-3"></i>
              <span className="text-xl font-semibold">LED Controls</span>
              <span className="text-sm text-white/70 mt-1">Patterns & settings</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/20">
            <div className="text-white/80 text-sm">
              Logged in: <span className="font-semibold text-white">{displayName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}