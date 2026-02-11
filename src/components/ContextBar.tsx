import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store';
import { sendCastRequest, sendCastRelease } from '../mqtt';
import { AMENITIES_CONFIG } from '../amenitiesData';

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
    displayName,
    clientId,
    amenityMode,
    selectedAmenityId,
    amenityImageIndex,
    deselectAmenity,
    exitAmenityMode,
    // Cast lock state
    castLocked,
    castLockedByName,
    castLockedByClientId,
    isCastLockedByOther,
    getCurrentViewImages,
    followCasting,
    setFollowCasting,
    setCastState,
    setAmenityImageIndex,
    toggleControlsSidebar
  } = useAppStore();

  const [castMessage, setCastMessage] = useState<string | null>(null);

  // ===== Follow-casting: auto-cast whenever navigation state changes =====
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the very first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only auto-cast if follow mode is active
    if (!isCasting || !followCasting) return;

    const images = getCurrentViewImages();
    if (images.length > 0) {
      const img = images[0]; // Cast the primary/current image
      console.log('[ContextBar] Follow-cast → auto-casting:', img.src);
      sendCastRequest(img.src, img.metadata, displayName);
    }
  }, [
    // Trigger on any navigation change
    currentFloor,
    currentRoom,
    currentDirection,
    currentMode,
    amenityMode,
    selectedAmenityId,
    amenityImageIndex,
    // Dependencies for the cast logic
    isCasting,
    followCasting
  ]);

  const selectedAmenity = selectedAmenityId 
    ? AMENITIES_CONFIG.find(a => a.id === selectedAmenityId) 
    : null;

  const handleCast = useCallback(async () => {
    // If already casting, stop
    if (isCasting) {
      console.log('[ContextBar] Stopping follow-cast');
      setFollowCasting(false);
      await sendCastRelease();
      setCastState(false, null, null);
      return;
    }

    // Check if cast is locked by another user
    if (isCastLockedByOther()) {
      const lockedBy = castLockedByName || 'another user';
      setCastMessage(`Cast is in use by ${lockedBy}`);
      setTimeout(() => setCastMessage(null), 3000);
      console.warn(`[ContextBar] Cast locked by ${lockedBy}`);
      return;
    }

    // Get current view image
    const images = getCurrentViewImages();
    
    if (images.length === 0) {
      console.warn('[ContextBar] No images to cast');
      setCastMessage('No images to cast');
      setTimeout(() => setCastMessage(null), 2000);
      return;
    }

    console.log('[ContextBar] Starting follow-cast mode');
    
    // Mark as casting and enable follow mode
    setCastState(true, clientId, displayName);
    setFollowCasting(true);

    // Cast the current image immediately
    const img = images[0];
    await sendCastRequest(img.src, img.metadata, displayName);
    console.log('[ContextBar] Initial cast:', img.src);

  }, [isCasting, isCastLockedByOther, castLockedByName, getCurrentViewImages, clientId, displayName, setCastState, setFollowCasting]);

  const handleBackNavigation = () => {
    if (amenityMode && selectedAmenityId) {
      deselectAmenity();
    } else if (amenityMode) {
      exitAmenityMode();
      selectFloor(null);
    } else {
      selectFloor(null);
    }
  };

  const roomNumber = getRoomNumber(currentFloor, currentRoom);

  // Build breadcrumb items
  const breadcrumbItems: { label: string; onClick?: () => void }[] = [];
  
  if (amenityMode) {
    breadcrumbItems.push({ label: 'Amenities' });
    if (selectedAmenity) {
      breadcrumbItems.push({ label: selectedAmenity.name });
      if (selectedAmenity.images.length > 1) {
        breadcrumbItems.push({ 
          label: selectedAmenity.imageLabels[amenityImageIndex] || `View ${amenityImageIndex + 1}` 
        });
      }
    }
  } else {
    if (currentFloor) {
      breadcrumbItems.push({ label: `Floor ${currentFloor}` });
    }
    if (currentRoom) {
      breadcrumbItems.push({ label: `Room ${roomNumber}` });
    }
    if (currentDirection) {
      breadcrumbItems.push({ label: currentDirection });
    }
  }

  // Determine cast button state
  const canCast = getCurrentViewImages().length > 0;
  const castLockBlocked = isCastLockedByOther();

  return (
    <>
      <div className="context-bar">
        <div className="breadcrumb">
          <button onClick={handleBackNavigation} className="breadcrumb-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            <span>Back</span>
          </button>
          <span className="breadcrumb-separator">{'\u203A'}</span>
          <div className="breadcrumb-items">
            {breadcrumbItems.map((item, idx) => (
              <span key={idx}>
                {idx > 0 && <span className="breadcrumb-separator">{'\u203A'}</span>}
                <span className="breadcrumb-item">{item.label}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="context-actions">
          {!amenityMode && (
            <button onClick={toggleControlsSidebar} className="icon-btn" title="LED Controls">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
            </button>
          )}
          <button 
            onClick={handleCast} 
            className={`cast-btn-top ${isCasting ? 'active' : ''} ${castLockBlocked ? 'locked' : ''}`}
            disabled={!canCast && !isCasting}
            title={
              castLockBlocked 
                ? `Cast locked by ${castLockedByName}` 
                : isCasting 
                  ? 'Stop casting (follow mode)' 
                  : 'Cast to TV (follows navigation)'
            }
          >
            {isCasting ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : castLockBlocked ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
                <line x1="2" y1="20" x2="2.01" y2="20"></line>
              </svg>
            )}
            <span>
              {isCasting 
                ? 'Stop Cast' 
                : castLockBlocked 
                  ? 'Locked' 
                  : 'Cast'
              }
            </span>
          </button>
        </div>
      </div>

      {/* Cast lock message toast */}
      {castMessage && (
        <div className="cast-message-toast">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{castMessage}</span>
        </div>
      )}

      {/* Follow-cast active indicator */}
      {isCasting && followCasting && (
        <div className="follow-cast-indicator">
          <div className="follow-cast-dot"></div>
          <span>Live casting — navigating will update the TV</span>
        </div>
      )}

      <style>{`
        .cast-btn-top.locked {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.5);
          cursor: not-allowed;
        }

        .cast-btn-top:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .cast-message-toast {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(239, 68, 68, 0.9);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 500;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
          animation: toast-in 0.3s ease;
          backdrop-filter: blur(8px);
        }

        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .follow-cast-indicator {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(34, 197, 94, 0.9);
          color: white;
          padding: 0.6rem 1.25rem;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 500;
          box-shadow: 0 4px 20px rgba(34, 197, 94, 0.5);
          backdrop-filter: blur(8px);
          animation: toast-in 0.3s ease;
        }

        .follow-cast-dot {
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          animation: pulse-dot 1.5s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>
    </>
  );
}