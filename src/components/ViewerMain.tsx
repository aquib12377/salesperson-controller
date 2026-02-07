import { useAppStore } from '../store';
import PolygonOverlay from './PolygonOverlay';
import DirectionButtons from './DirectionButtons';

export default function ViewerMain() {
  const { 
    currentFloor, 
    currentMode, 
    floorToImageVal, 
    viewsByRoom, 
    currentRoom, 
    currentDirection 
  } = useAppStore();

  const getImageSrc = () => {
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
    
    // ROOM MODE: Show room overview (if you have room images)
    if (currentMode === 'room' && currentRoom) {
      const imagePath = `/rooms/r${currentRoom}.png`;
      console.log('[ViewerMain] Room mode:', imagePath);
      return imagePath;
    }
    
    // FLOOR MODE: Show floor plan
    if (currentFloor) {
      const imageVal = floorToImageVal.get(currentFloor);
      if (imageVal) {
        // Images are named like "1.png", "2.png" based on the image column
        const imagePath = `/floors/${imageVal}.png`;
        console.log('[ViewerMain] Floor mode:', { floor: currentFloor, imageVal, path: imagePath });
        return imagePath;
      } else {
        console.warn('[ViewerMain] No image mapping for floor:', currentFloor);
        return '/floors/1.png'; // Fallback
      }
    }
    
    console.warn('[ViewerMain] No valid state for image');
    return '/floors/1.svg';
  };

  const imageSrc = getImageSrc();

  return (
    <div className="view-container">
      <div className="view-wrapper">
        <img 
          src={imageSrc} 
          alt={`${currentMode} view`}
          className="glass main-image"
          onError={(e) => {
            console.error('[ViewerMain] Image load error:', imageSrc);
            const target = e.target as HTMLImageElement;
            target.style.border = '2px solid red';
            // Show error placeholder
            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1152" height="680"%3E%3Crect width="1152" height="680" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23ff0000" font-size="24"%3EImage not found: ' + encodeURIComponent(imageSrc) + '%3C/text%3E%3C/svg%3E';
          }}
          onLoad={() => {
            console.log('[ViewerMain] Image loaded successfully:', imageSrc);
          }}
        />
        
        {currentMode === 'floor' && <PolygonOverlay />}
        {currentMode === 'room' && <DirectionButtons />}
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
        <div>Image: {imageSrc}</div>
      </div>
    </div>
  );
}