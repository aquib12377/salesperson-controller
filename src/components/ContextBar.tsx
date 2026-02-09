import { useState } from 'react';
import { useAppStore } from '../store';
import { sendCastRequest, sendCastRelease } from '../mqtt';
import AmenitiesControl from './AmenitiesControl';

function getRoomNumber(floor: number | null, room: string | null): string {
  if (!floor || !room) return '';
  const roomNum = parseInt(room);
  return `${floor}${roomNum.toString().padStart(2, '0')}`;
}

export default function ContextBar() {
  const { 
    currentFloor, 
    currentRoom, 
    currentDirection, 
    currentMode,
    isCasting, 
    selectFloor,
    floorToImageVal,
    viewsByRoom,
    displayName
  } = useAppStore();

  const [showAmenities, setShowAmenities] = useState(false);

  const handleCast = async () => {
    if (isCasting) {
      await sendCastRelease();
      return;
    }

    // Determine what to cast based on current mode
    let imageSrc = '';
    let metadata: any = { floor: currentFloor };

    if (currentMode === 'view' && currentRoom && currentDirection) {
      // CAST VIEW IMAGE
      const views = viewsByRoom.get(currentRoom);
      const view = views?.find(v => v.direction === currentDirection);
      if (view) {
        imageSrc = `/view/${view.filename}`;
        metadata = {
          floor: currentFloor,
          room: currentRoom,
          direction: currentDirection,
          type: 'view'
        };
      }
    } else if (currentMode === 'room' && currentRoom) {
      // CAST ROOM IMAGE
      imageSrc = `/rooms/r${currentRoom}.png`;
      metadata = {
        floor: currentFloor,
        room: currentRoom,
        type: 'room'
      };
    } else if (currentMode === 'floor' && currentFloor) {
      // CAST FLOOR MAP
      const imageVal = floorToImageVal.get(currentFloor);
      if (imageVal) {
        imageSrc = `/floors/${imageVal}.png`;
        metadata = {
          floor: currentFloor,
          type: 'floor'
        };
      }
    }

    if (imageSrc) {
      console.log('[ContextBar] Casting:', { imageSrc, metadata, holderName: displayName });
      await sendCastRequest(imageSrc, metadata, displayName);
    } else {
      console.warn('[ContextBar] No image to cast');
    }
  };

  const roomNumber = getRoomNumber(currentFloor, currentRoom);

  return (
    <>
      <div className="context-bar">
        <div className="breadcrumb">
          <button onClick={() => selectFloor(null)} className="breadcrumb-back">
            <i data-lucide="arrow-left" className="w-5 h-5"></i>
            <span>Home</span>
          </button>
          <span className="breadcrumb-separator">›</span>
          <div className="breadcrumb-items">
            <span className="breadcrumb-item">Floor {currentFloor}</span>
            {currentRoom && (
              <>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-item">Room {roomNumber}</span>
              </>
            )}
            {currentDirection && (
              <>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-item">{currentDirection}</span>
              </>
            )}
          </div>
        </div>
        <div className="context-actions">
          <button onClick={() => setShowAmenities(true)} className="icon-btn" title="Amenities">
            <i data-lucide="building-2" className="w-5 h-5"></i>
          </button>
          <button onClick={handleCast} className={`cast-btn-top ${isCasting ? 'active' : ''}`}>
            <i data-lucide={isCasting ? 'cast-off' : 'cast'} className="w-5 h-5"></i>
            <span>{isCasting ? 'Stop' : 'Cast'}</span>
          </button>
        </div>
      </div>

      <AmenitiesControl isOpen={showAmenities} onClose={() => setShowAmenities(false)} />
    </>
  );
}