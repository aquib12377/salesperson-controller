import { useState, useEffect } from 'react';
import { sendCommand } from '../mqtt';

interface Amenity {
  id: number;
  name: string;
  ledLine: number; // LED line number on the ESP32
}

const AMENITIES: Amenity[] = [
  { id: 1, name: 'LOUNGE', ledLine: 1 },
  { id: 2, name: 'ART AND CRAFT / TODDLERS AREA', ledLine: 2 },
  { id: 3, name: 'MULTIPURPOSE INDOOR GAMES', ledLine: 3 },
  { id: 4, name: 'FITNESS CENTRE', ledLine: 4 },
  { id: 5, name: 'WAITING LOUNGE', ledLine: 5 },
  { id: 6, name: 'CONFERENCE ROOM', ledLine: 6 },
  { id: 7, name: 'TOILET (MALE)', ledLine: 7 },
  { id: 8, name: 'TOILET (FEMALE)', ledLine: 8 },
  { id: 9, name: 'HANDICAP TOILET', ledLine: 9 },
  { id: 10, name: 'KITCHEN', ledLine: 10 },
  { id: 11, name: 'JANITOR/CLEANING', ledLine: 11 },
  { id: 12, name: 'BANQUET HALL', ledLine: 12 },
  { id: 13, name: 'PICKLE BALL COURT', ledLine: 13 },
  { id: 14, name: 'WALKWAY', ledLine: 14 },
  { id: 15, name: 'SITOUT SPACE', ledLine: 15 },
  { id: 16, name: 'LAWN', ledLine: 16 },
  { id: 17, name: 'MEDITATION AREA', ledLine: 17 }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AmenitiesControl({ isOpen, onClose }: Props) {
  const [selectedAmenity, setSelectedAmenity] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      // Initialize: Turn floor 16 white
      console.log('[AmenitiesControl] Initializing - Setting Floor 16 white');
      sendCommand('set_floor_color', { floor: 16 });
      setIsInitialized(true);
    }

    if (!isOpen) {
      setIsInitialized(false);
      setSelectedAmenity(null);
    }
  }, [isOpen, isInitialized]);

  useEffect(() => {
    if (isOpen && (window as any).lucide) {
      setTimeout(() => {
        (window as any).lucide.createIcons();
      }, 100);
    }
  }, [isOpen, selectedAmenity]);

  const handleAmenityClick = async (amenity: Amenity) => {
    console.log(`[AmenitiesControl] Selected: ${amenity.name} (Line ${amenity.ledLine})`);
    setSelectedAmenity(amenity.id);
    
    // Send command to turn ON specific LED line for this amenity
    await sendCommand('amenity_led_on', { 
      floor: 16, 
      line: amenity.ledLine,
      amenityName: amenity.name
    });
  };

  const handleTurnOffAll = async () => {
    console.log('[AmenitiesControl] Turning off all amenity LEDs');
    setSelectedAmenity(null);
    
    // Turn off all amenities, keep floor 16 white base
    await sendCommand('amenity_all_off', { floor: 16 });
  };

  if (!isOpen) return null;

  return (
    <div className="amenities-overlay">
      <div className="amenities-backdrop" onClick={onClose}></div>
      <div className="amenities-modal">
        <div className="amenities-header">
          <div className="flex items-center gap-3">
            <i data-lucide="building-2" className="w-6 h-6 text-white"></i>
            <h3 className="text-xl font-bold text-white">Floor 16 - Amenities</h3>
          </div>
          <button onClick={onClose} className="close-btn-simple">
            <i data-lucide="x" className="w-6 h-6"></i>
          </button>
        </div>

        <div className="amenities-body">
          <div className="mb-4">
            <button
              onClick={handleTurnOffAll}
              className="control-btn w-full bg-red-600/30 border-red-600/50 hover:bg-red-600/50"
            >
              <i data-lucide="power-off" className="w-5 h-5 inline mr-2"></i>
              Turn Off All Amenities
            </button>
          </div>

          <div className="amenities-grid">
            {AMENITIES.map(amenity => (
              <button
                key={amenity.id}
                onClick={() => handleAmenityClick(amenity)}
                className={`amenity-card ${selectedAmenity === amenity.id ? 'active' : ''}`}
              >
                <div className="amenity-number">{amenity.id}</div>
                <div className="amenity-name">{amenity.name}</div>
                {selectedAmenity === amenity.id && (
                  <div className="amenity-indicator">
                    <i data-lucide="zap" className="w-4 h-4"></i>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .amenities-overlay {
          position: fixed;
          inset: 0;
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .amenities-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }

        .amenities-modal {
          position: relative;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .amenities-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .amenities-body {
          padding: 1.5rem;
          overflow-y: auto;
        }

        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .amenities-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }
        }

        @media (max-width: 480px) {
          .amenities-grid {
            grid-template-columns: 1fr;
          }
        }

        .amenity-card {
          position: relative;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .amenity-card:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
        }

        .amenity-card.active {
          background: rgba(34, 197, 94, 0.3);
          border-color: rgba(34, 197, 94, 0.8);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
        }

        .amenity-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
        }

        .amenity-name {
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.3;
        }

        .amenity-indicator {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          color: #22c55e;
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}