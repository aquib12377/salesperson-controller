import { useAppStore } from '../store';
import { sendCommand } from '../mqtt';
import { AMENITIES_CONFIG } from '../amenitiesData';

export default function FloorSelector() {
  const { 
    floors, 
    currentFloor, 
    selectFloor, 
    amenityMode, 
    exitAmenityMode, 
    selectAmenity, 
    selectedAmenityId,
    deselectAmenity
  } = useAppStore();

  const handleFloorClick = async (floorId: number) => {
    console.log(`[FloorSelector] Floor ${floorId} clicked`);

    // Navigate to floor
    selectFloor(floorId);

    // Send LED command to turn floor ON (white)
    if (floorId >= 3 && floorId <= 15) {
      console.log(`[FloorSelector] Sending LED command for floor ${floorId}`);
      if (floorId === 15) {
        sendCommand('relay_toggle', { relay: 'terrace' });
      } else {
        await sendCommand('set_floor_color', { floor: floorId });
      }
    } else if (floorId === 16) {
      // Amenities floor - set base white
      console.log(`[FloorSelector] Setting Floor 16 white for amenities`);
      await sendCommand('set_floor_color', { floor: 16 });
    }
  };

  const handleAmenityClick = async (amenityId: string) => {
    const amenity = AMENITIES_CONFIG.find(a => a.id === amenityId);
    if (!amenity) return;

    console.log(`[FloorSelector] Amenity selected: ${amenity.name}`);
    selectAmenity(amenityId);

    // Send LED command for the amenity
    await sendCommand('custom_leds', {
      floor: 16,
      count: amenity.ledCount,
      r: amenity.color.r,
      g: amenity.color.g,
      b: amenity.color.b
    });
  };

  const handleBackToFloors = () => {
    console.log('[FloorSelector] Back to floors');
    exitAmenityMode();
    selectFloor(null);
  };

  const handleBackToAmenityList = () => {
    console.log('[FloorSelector] Back to amenity list');
    deselectAmenity();
    // Reset floor 16 to white
    sendCommand('set_floor_color', { floor: 16 });
  };

  // ========== AMENITY MODE: Show amenity list ==========
  if (amenityMode) {
    return (
      <div className="floor-selector">
        {/* Back button */}
        <button 
          onClick={selectedAmenityId ? handleBackToAmenityList : handleBackToFloors} 
          className="amenity-back-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
          <span>{selectedAmenityId ? 'Amenities' : 'Floors'}</span>
        </button>

        <h3 className="floor-selector-title">
          {selectedAmenityId ? 'Views' : 'Amenities'}
        </h3>

        <div className="floor-buttons">
          {!selectedAmenityId ? (
            // Show all amenities
            AMENITIES_CONFIG.map(amenity => {
              const hasImages = amenity.images.length > 0;
              return (
                <button
                  key={amenity.id}
                  onClick={() => handleAmenityClick(amenity.id)}
                  className={`floor-btn amenity-item-btn ${selectedAmenityId === amenity.id ? 'active' : ''} ${!hasImages ? 'no-images' : ''}`}
                  title={hasImages ? `${amenity.images.length} view(s)` : 'LED only'}
                >
                  <div className="amenity-btn-content">
                    <span 
                      className="amenity-color-dot" 
                      style={{ backgroundColor: `rgb(${amenity.color.r},${amenity.color.g},${amenity.color.b})` }}
                    ></span>
                    <span className="amenity-btn-name">{amenity.name}</span>
                    {hasImages && (
                      <span className="amenity-image-count">{amenity.images.length}</span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            // Show image selection for selected amenity
            (() => {
              const amenity = AMENITIES_CONFIG.find(a => a.id === selectedAmenityId);
              if (!amenity || amenity.images.length === 0) {
                return (
                  <div className="no-images-msg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>No images available</span>
                    <span className="text-xs" style={{ opacity: 0.5 }}>LED control only</span>
                  </div>
                );
              }
              
              return amenity.images.map((img, idx) => (
                <AmenityImageButton 
                  key={img} 
                  amenityId={amenity.id}
                  imageIndex={idx} 
                  label={amenity.imageLabels[idx] || `View ${idx + 1}`}
                />
              ));
            })()
          )}
        </div>

        <style>{`
          .amenity-back-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            color: white;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
            margin-bottom: 0.5rem;
          }

          .amenity-back-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateX(-2px);
          }

          .amenity-item-btn {
            text-align: left !important;
            padding: 0.5rem 0.6rem !important;
          }

          .amenity-item-btn.no-images {
            opacity: 0.6;
          }

          .amenity-btn-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: 100%;
          }

          .amenity-color-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.4);
            flex-shrink: 0;
          }

          .amenity-btn-name {
            flex: 1;
            font-size: 11px;
            line-height: 1.3;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          @media (min-width: 768px) {
            .amenity-btn-name {
              font-size: 12px;
            }
          }

          .amenity-image-count {
            background: rgba(99, 102, 241, 0.6);
            color: white;
            font-size: 10px;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 9999px;
            flex-shrink: 0;
          }

          .no-images-msg {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 2rem 1rem;
            color: rgba(255,255,255,0.5);
            font-size: 12px;
            text-align: center;
          }

          .view-btn-active-indicator {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #22c55e;
            flex-shrink: 0;
            box-shadow: 0 0 6px rgba(34, 197, 94, 0.8);
          }
        `}</style>
      </div>
    );
  }

  // ========== NORMAL MODE: Show floor list ==========
  return (
    <div className="floor-selector">
      <h3 className="floor-selector-title">Floors</h3>
      <div className="floor-buttons">
        {floors.map(floor => (
          <button
            key={floor.id}
            onClick={() => handleFloorClick(floor.id)}
            className={`floor-btn ${currentFloor === floor.id ? 'active' : ''}`}
          >
            {floor.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Sub-component for amenity image buttons in the sidebar
function AmenityImageButton({ amenityId, imageIndex, label }: { amenityId: string; imageIndex: number; label: string }) {
  const { amenityImageIndex, setAmenityImageIndex } = useAppStore();
  const isActive = amenityImageIndex === imageIndex;

  return (
    <button
      onClick={() => setAmenityImageIndex(imageIndex)}
      className={`floor-btn ${isActive ? 'active' : ''}`}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <span>{label}</span>
      {isActive && <span className="view-btn-active-indicator"></span>}
    </button>
  );
}