import { useAppStore } from '../store';
import { AMENITIES_CONFIG } from '../amenitiesData';
import PolygonOverlay from './PolygonOverlay';
import DirectionButtons from './DirectionButtons';

export default function ViewerMain() {
  const { 
    currentFloor, 
    currentMode, 
    floorToImageVal, 
    viewsByRoom, 
    currentRoom, 
    currentDirection,
    amenityMode,
    selectedAmenityId,
    amenityImageIndex,
    setAmenityImageIndex
  } = useAppStore();

  const getImageSrc = () => {
    // AMENITY MODE: Show amenity image
    if (amenityMode && selectedAmenityId) {
      const amenity = AMENITIES_CONFIG.find(a => a.id === selectedAmenityId);
      if (amenity && amenity.images.length > 0) {
        const safeIndex = Math.min(amenityImageIndex, amenity.images.length - 1);
        const imagePath = `/amenities/${amenity.images[safeIndex]}`;
        console.log('[ViewerMain] Amenity mode:', { amenity: amenity.name, index: safeIndex, path: imagePath });
        return imagePath;
      }
      return ''; // No images for this amenity
    }

    // VIEW MODE: Show specific room direction view
    if (currentMode === 'view' && currentRoom && currentDirection) {
      const views = viewsByRoom.get(currentRoom);
      const view = views?.find(v => v.direction === currentDirection);
      
      if (view) {
        const imagePath = `/view/${view.filename}`;
        console.log('[ViewerMain] View mode:', imagePath);
        return imagePath;
      } else {
        console.warn('[ViewerMain] View not found:', { currentRoom, currentDirection });
        return '';
      }
    }
    
    // ROOM MODE: Show room overview
    if (currentMode === 'room' && currentRoom) {
      const imagePath = `/rooms/r${currentRoom}.png`;
      console.log('[ViewerMain] Room mode:', imagePath);
      return imagePath;
    }
    
    // FLOOR MODE: Show floor plan
    if (currentFloor) {
      const imageVal = floorToImageVal.get(currentFloor);
      if (imageVal) {
        const imagePath = `/floors/${imageVal}.png`;
        console.log('[ViewerMain] Floor mode:', { floor: currentFloor, imageVal, path: imagePath });
        return imagePath;
      } else {
        console.warn('[ViewerMain] No image mapping for floor:', currentFloor);
        return '/floors/1.png';
      }
    }
    
    console.warn('[ViewerMain] No valid state for image');
    return '/floors/1.svg';
  };

  const imageSrc = getImageSrc();

  // Get amenity data for image buttons
  const selectedAmenity = selectedAmenityId 
    ? AMENITIES_CONFIG.find(a => a.id === selectedAmenityId) 
    : null;
  
  const showAmenityImageButtons = amenityMode && selectedAmenity && selectedAmenity.images.length > 1;

  // Show placeholder when amenity has no images
  const showAmenityPlaceholder = amenityMode && selectedAmenityId && (!selectedAmenity || selectedAmenity.images.length === 0);

  // Show welcome screen when in amenity mode but no amenity selected
  const showAmenityWelcome = amenityMode && !selectedAmenityId;

  return (
    <div className="view-container">
      <div className="view-wrapper">
        {showAmenityWelcome ? (
          <div className="amenity-welcome">
            <div className="amenity-welcome-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h2 className="amenity-welcome-title">Rooftop Amenities</h2>
            <p className="amenity-welcome-text">Select an amenity from the sidebar to view</p>
          </div>
        ) : showAmenityPlaceholder ? (
          <div className="amenity-welcome">
            <div className="amenity-welcome-icon" style={{ color: selectedAmenity ? `rgb(${selectedAmenity.color.r},${selectedAmenity.color.g},${selectedAmenity.color.b})` : 'white' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
            </div>
            <h2 className="amenity-welcome-title">{selectedAmenity?.name || 'Amenity'}</h2>
            <p className="amenity-welcome-text">LED control activated — no images available for this amenity</p>
          </div>
        ) : (
          <>
            <img 
              src={imageSrc} 
              alt={`${currentMode} view`}
              className="glass main-image"
              onError={(e) => {
                console.error('[ViewerMain] Image load error:', imageSrc);
                const target = e.target as HTMLImageElement;
                target.style.border = '2px solid red';
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1152" height="680"%3E%3Crect width="1152" height="680" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23ff0000" font-size="24"%3EImage not found: ' + encodeURIComponent(imageSrc) + '%3C/text%3E%3C/svg%3E';
              }}
              onLoad={() => {
                console.log('[ViewerMain] Image loaded successfully:', imageSrc);
              }}
            />
            
            {currentMode === 'floor' && !amenityMode && <PolygonOverlay />}
            {currentMode === 'room' && !amenityMode && <DirectionButtons />}
          </>
        )}

        {/* Amenity image selector buttons (shown on top when multiple images) */}
        {showAmenityImageButtons && (
          <div className="amenity-image-buttons">
            {selectedAmenity!.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setAmenityImageIndex(idx)}
                className={`amenity-img-btn ${amenityImageIndex === idx ? 'active' : ''}`}
              >
                {selectedAmenity!.imageLabels[idx] || `View ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Debug info */}
      <div style={{ 
        position: 'absolute', 
        bottom: '10px', 
        left: '10px', 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '10px',
        fontSize: '12px',
        fontFamily: 'monospace',
        borderRadius: '5px'
      }}>
        <div>Mode: {currentMode}</div>
        <div>Floor: {currentFloor || 'none'}</div>
        <div>Room: {currentRoom || 'none'}</div>
        <div>Direction: {currentDirection || 'none'}</div>
        {amenityMode && <div>Amenity: {selectedAmenityId || 'none'}</div>}
        {amenityMode && selectedAmenityId && <div>ImgIdx: {amenityImageIndex}</div>}
        <div>Image: {imageSrc}</div>
      </div>

      <style>{`
        .amenity-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 3rem;
          text-align: center;
        }

        .amenity-welcome-icon {
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 0.5rem;
        }

        .amenity-welcome-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }

        @media (min-width: 768px) {
          .amenity-welcome-title {
            font-size: 2rem;
          }
        }

        .amenity-welcome-text {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          max-width: 300px;
        }

        .amenity-image-buttons {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          max-width: 300px;
          z-index: 10;
        }

        @media (min-width: 768px) {
          .amenity-image-buttons {
            top: 1rem;
            right: 1rem;
            gap: 0.5rem;
          }
        }

        .amenity-img-btn {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(6px);
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 9999px;
          font-weight: 700;
          font-size: 12px;
          color: #1f2937;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        @media (min-width: 768px) {
          .amenity-img-btn {
            padding: 0.6rem 1.25rem;
            font-size: 13px;
          }
        }

        .amenity-img-btn:hover {
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .amenity-img-btn.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
}