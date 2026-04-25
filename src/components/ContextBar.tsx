import { useEffect, useRef, useCallback } from 'react';
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
    selectRoom,
    selectDirection,
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

  // ===== Auto-stop cast after 15 minutes =====
  const castTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isCasting) {
      castTimerRef.current = setTimeout(async () => {
        console.log('[ContextBar] Auto-stopping cast after 15 minutes');
        setFollowCasting(false);
        await sendCastRelease();
        setCastState(false, null, null);
      }, 15 * 60 * 1000);
    } else {
      if (castTimerRef.current) {
        clearTimeout(castTimerRef.current);
        castTimerRef.current = null;
      }
    }
    return () => {
      if (castTimerRef.current) clearTimeout(castTimerRef.current);
    };
  }, [isCasting]);

  // ===== Follow-casting: auto-cast whenever navigation state changes =====
  const isFirstRender = useRef(true);
  const prevCastingRef = useRef(false);

  useEffect(() => {
    const justStarted = !prevCastingRef.current && isCasting;
    prevCastingRef.current = isCasting;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!isCasting || !followCasting) return;
    // handleCast already sent the first frame; skip the false→true transition
    if (justStarted) return;

    const images = getCurrentViewImages();
    if (images.length > 0) {
      const img = images[0];
      console.log('[ContextBar] Follow-cast → auto-casting:', img.src);
      sendCastRequest(img.src, img.metadata, displayName);
    }
  }, [
    currentFloor,
    currentRoom,
    currentDirection,
    currentMode,
    amenityMode,
    selectedAmenityId,
    amenityImageIndex,
    isCasting,
    followCasting,
    displayName,
    getCurrentViewImages,
  ]);

  const selectedAmenity = selectedAmenityId 
    ? AMENITIES_CONFIG.find(a => a.id === selectedAmenityId) 
    : null;

  // Best-effort release when the holder closes/refreshes the tab
  useEffect(() => {
    if (!isCasting) return;
    const handler = () => { sendCastRelease(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isCasting]);

  const handleCast = useCallback(async () => {
    // If already casting, stop
    if (isCasting) {
      console.log('[ContextBar] Stopping follow-cast');
      setFollowCasting(false);
      await sendCastRelease();
      setCastState(false, null, null);
      return;
    }

    // Get current view image
    const images = getCurrentViewImages();
    if (images.length === 0) {
      console.warn('[ContextBar] No images to cast');
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

  }, [isCasting, getCurrentViewImages, clientId, displayName, setCastState, setFollowCasting]);

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
    breadcrumbItems.push({
      label: 'Amenities',
      onClick: selectedAmenityId ? () => deselectAmenity() : undefined
    });
    if (selectedAmenity) {
      breadcrumbItems.push({
        label: selectedAmenity.name,
        onClick: selectedAmenity.images.length > 1 ? () => setAmenityImageIndex(0) : undefined
      });
      if (selectedAmenity.images.length > 1) {
        breadcrumbItems.push({
          label: selectedAmenity.imageLabels[amenityImageIndex] || `View ${amenityImageIndex + 1}`
        });
      }
    }
  } else {
    if (currentFloor) {
      breadcrumbItems.push({
        label: `Floor ${currentFloor}`,
        onClick: currentRoom ? () => selectRoom(null) : undefined
      });
    }
    if (currentRoom) {
      breadcrumbItems.push({
        label: `Room ${roomNumber}`,
        onClick: currentDirection ? () => selectDirection(null) : undefined
      });
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
                {item.onClick ? (
                  <button className="breadcrumb-item clickable" onClick={item.onClick}>
                    {item.label}
                  </button>
                ) : (
                  <span className="breadcrumb-item">{item.label}</span>
                )}
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
            className={`cast-btn-top ${isCasting ? 'active' : ''}`}
            disabled={!canCast && !isCasting}
            title={
              castLockBlocked
                ? `Take over from ${castLockedByName}`
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
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
                <line x1="2" y1="20" x2="2.01" y2="20"></line>
              </svg>
            )}
            <span>{isCasting ? 'Stop Cast' : 'Cast'}</span>
          </button>
        </div>
      </div>

      {/* Follow-cast active indicator */}
      {isCasting && followCasting && (
        <div className="follow-cast-indicator">
          <div className="follow-cast-dot"></div>
          <span>Live casting — navigating will update the TV</span>
        </div>
      )}

      <style>{`
        .breadcrumb-item.clickable {
          background: none;
          border: none;
          color: inherit;
          font: inherit;
          padding: 0;
          cursor: pointer;
          text-decoration: underline dotted rgba(255, 255, 255, 0.5);
          opacity: 0.8;
          transition: opacity 0.15s;
        }

        .breadcrumb-item.clickable:hover {
          opacity: 1;
          text-decoration: underline solid rgba(255, 255, 255, 0.9);
        }

        .cast-btn-top:disabled {
          opacity: 0.4;
          cursor: not-allowed;
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