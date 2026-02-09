import { useState, useEffect } from 'react';
import { sendCommand } from '../mqtt';

interface Amenity {
  id: number;
  name: string;
  ledCount: number; // Number of LEDs to light up for this amenity
  color: { r: number; g: number; b: number }; // RGB color for this amenity
}

// Define amenities with LED counts and unique colors
// IMPORTANT: Adjust ledCount values based on your actual LED distribution on Floor 16
// These values create a "ladder" effect where each amenity lights up progressively more LEDs
const AMENITIES: Amenity[] = [
  { id: 1, name: 'LOUNGE', ledCount: 20, color: { r: 255, g: 255, b: 255 } }, // White
  { id: 2, name: 'ART AND CRAFT / TODDLERS AREA', ledCount: 25, color: { r: 255, g: 180, b: 100 } }, // Warm Orange
  { id: 3, name: 'MULTIPURPOSE INDOOR GAMES', ledCount: 30, color: { r: 100, g: 200, b: 255 } }, // Sky Blue
  { id: 4, name: 'FITNESS CENTRE', ledCount: 35, color: { r: 255, g: 80, b: 80 } }, // Red
  { id: 5, name: 'WAITING LOUNGE', ledCount: 40, color: { r: 180, g: 255, b: 180 } }, // Light Green
  { id: 6, name: 'CONFERENCE ROOM', ledCount: 45, color: { r: 255, g: 255, b: 100 } }, // Yellow
  { id: 7, name: 'TOILET (MALE)', ledCount: 50, color: { r: 100, g: 150, b: 255 } }, // Blue
  { id: 8, name: 'TOILET (FEMALE)', ledCount: 55, color: { r: 255, g: 150, b: 200 } }, // Pink
  { id: 9, name: 'HANDICAP TOILET', ledCount: 60, color: { r: 200, g: 200, b: 255 } }, // Light Purple
  { id: 10, name: 'KITCHEN', ledCount: 65, color: { r: 255, g: 200, b: 80 } }, // Orange
  { id: 11, name: 'JANITOR/CLEANING', ledCount: 70, color: { r: 150, g: 150, b: 150 } }, // Gray
  { id: 12, name: 'BANQUET HALL', ledCount: 75, color: { r: 255, g: 215, b: 0 } }, // Gold
  { id: 13, name: 'PICKLE BALL COURT', ledCount: 80, color: { r: 0, g: 255, b: 100 } }, // Bright Green
  { id: 14, name: 'WALKWAY', ledCount: 85, color: { r: 255, g: 255, b: 255 } }, // White
  { id: 15, name: 'SITOUT SPACE', ledCount: 90, color: { r: 200, g: 255, b: 150 } }, // Light Yellow-Green
  { id: 16, name: 'LAWN', ledCount: 95, color: { r: 100, g: 255, b: 100 } }, // Green
  { id: 17, name: 'MEDITATION AREA', ledCount: 100, color: { r: 150, g: 100, b: 255 } } // Purple
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
      // Initialize: Turn floor 16 white using set_floor_color
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
    console.log(`[AmenitiesControl] Selected: ${amenity.name} (${amenity.ledCount} LEDs, RGB: ${amenity.color.r},${amenity.color.g},${amenity.color.b})`);
    setSelectedAmenity(amenity.id);
    
    // Use existing custom_leds command
    // This will light up the first 'ledCount' LEDs with the specified color
    await sendCommand('custom_leds', { 
      floor: 16, 
      count: amenity.ledCount,
      r: amenity.color.r,
      g: amenity.color.g,
      b: amenity.color.b
    });
    
    console.log(`[AmenitiesControl] ✅ Command sent: custom_leds for ${amenity.name}`);
  };

  const handleTurnOffAll = async () => {
    console.log('[AmenitiesControl] Resetting Floor 16 to white base');
    setSelectedAmenity(null);
    
    // Reset floor 16 to all white
    await sendCommand('set_floor_color', { floor: 16 });
  };

  if (!isOpen) return null;

  return (
    <div className="amenities-overlay">
      <div className="amenities-backdrop" onClick={onClose}></div>
      <div className="amenities-modal">
        <div className="amenities-header">
          <div className="flex items-center gap-3">
            <i data-lucide="building-2" className="w-6 h-6 text-white"></i>
            <h3 className="text-xl font-bold text-white">Floor 16 - Amenities Control</h3>
          </div>
          <button onClick={onClose} className="close-btn-simple">
            <i data-lucide="x" className="w-6 h-6"></i>
          </button>
        </div>

        <div className="amenities-body">
          <div className="mb-4 p-3 bg-blue-600/20 border border-blue-600/40 rounded-lg">
            <div className="text-sm text-blue-200">
              <i data-lucide="info" className="w-4 h-4 inline mr-2"></i>
              Click any amenity to highlight it. Each amenity uses the existing <code>custom_leds</code> command.
            </div>
          </div>

          <div className="mb-4">
            <button
              onClick={handleTurnOffAll}
              className="control-btn w-full bg-red-600/30 border-red-600/50 hover:bg-red-600/50"
            >
              <i data-lucide="power-off" className="w-5 h-5 inline mr-2"></i>
              Reset Floor 16 (All White)
            </button>
          </div>

          <div className="amenities-grid">
            {AMENITIES.map(amenity => (
              <button
                key={amenity.id}
                onClick={() => handleAmenityClick(amenity)}
                className={`amenity-card ${selectedAmenity === amenity.id ? 'active' : ''}`}
                style={{
                  borderColor: selectedAmenity === amenity.id 
                    ? `rgb(${amenity.color.r}, ${amenity.color.g}, ${amenity.color.b})` 
                    : undefined
                }}
              >
                <div className="amenity-number">{amenity.id}</div>
                <div className="amenity-name">{amenity.name}</div>
                <div className="amenity-info">
                  {amenity.ledCount} LEDs
                </div>
                <div 
                  className="amenity-color-preview" 
                  style={{ 
                    backgroundColor: `rgb(${amenity.color.r}, ${amenity.color.g}, ${amenity.color.b})` 
                  }}
                ></div>
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
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
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
          min-height: 120px;
        }

        .amenity-card:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }

        .amenity-card.active {
          background: rgba(34, 197, 94, 0.2);
          border-width: 3px;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
          transform: scale(1.02);
        }

        .amenity-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1;
        }

        .amenity-name {
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.3;
          flex-grow: 1;
        }

        .amenity-info {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .amenity-color-preview {
          position: absolute;
          bottom: 0.75rem;
          right: 0.75rem;
          width: 2rem;
          height: 2rem;
          border-radius: 0.375rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .amenity-indicator {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          color: #22c55e;
          animation: pulse-glow 2s ease-in-out infinite;
          filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.8));
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }

        code {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875em;
        }
      `}</style>
    </div>
  );
}