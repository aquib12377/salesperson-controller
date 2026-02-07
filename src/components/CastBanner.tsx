import { useAppStore } from '../store';

export default function CastBanner() {
  const { isCasting, castHolderName } = useAppStore();

  return (
    <div className={`cast-banner ${isCasting || castHolderName ? 'active' : ''}`}>
      Casting: {isCasting ? 'You' : (castHolderName || 'Idle')}
    </div>
  );
}
