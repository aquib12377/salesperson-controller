import { useAppStore } from '../store';

export default function CastBanner() {
  const { isCasting, castHolderName, castLocked, castLockedByName, clientId, castLockedByClientId } = useAppStore();

  // Show banner when someone is casting
  const isActive = castLocked || isCasting;
  const isOtherCasting = castLocked && castLockedByClientId !== clientId;
  
  let displayText = 'Idle';
  if (isCasting) {
    displayText = 'You are casting';
  } else if (isOtherCasting && castLockedByName) {
    displayText = `${castLockedByName} is casting`;
  } else if (castHolderName) {
    displayText = `Casting: ${castHolderName}`;
  }

  return (
    <div className={`cast-banner ${isActive ? 'active' : ''} ${isOtherCasting ? 'other-casting' : ''}`}>
      {isOtherCasting && (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', flexShrink: 0 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      )}
      {displayText}
    </div>
  );
}
