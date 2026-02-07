import { useAppStore } from '../store';

export default function DirectionButtons() {
  const { selectDirection, viewsByRoom, currentRoom, currentFloor } = useAppStore();

  if (!currentRoom || !currentFloor) return null;

  // Hide direction buttons for commercial floors (1 and 2)
  if (currentFloor === 1 || currentFloor === 2) {
    console.log('[DirectionButtons] Commercial floor - hiding direction buttons');
    return null;
  }

  const views = viewsByRoom.get(currentRoom) || [];
  
  // Filter views for current floor and extract base directions
  const currentFloorViews = views.filter(v => 
    currentFloor && v.floorNum === String(currentFloor)
  );
  
  // Extract unique base directions (N, E, S, W) from full directions (N1, E2, etc.)
  const availableDirections = new Set(
    currentFloorViews.map(v => v.direction.charAt(0))
  );

  console.log(`[DirectionButtons] Room ${currentRoom}, Floor ${currentFloor}:`, {
    totalViews: views.length,
    currentFloorViews: currentFloorViews.length,
    availableDirections: Array.from(availableDirections)
  });

  const handleDirectionClick = (dir: string) => {
    // Find the full direction for this base direction and current floor
    const fullDirection = currentFloorViews.find(v => v.direction.charAt(0) === dir)?.direction;
    
    if (fullDirection) {
      console.log(`[DirectionButtons] Clicked ${dir} → ${fullDirection}`);
      selectDirection(fullDirection);
    }
  };

  return (
    <div className="direction-buttons">
      {['N', 'E', 'S', 'W'].map(dir => {
        const isAvailable = availableDirections.has(dir);
        return (
          <button
            key={dir}
            onClick={() => handleDirectionClick(dir)}
            className={`dir-btn ${isAvailable ? 'available' : 'disabled'}`}
            disabled={!isAvailable}
            style={{ opacity: isAvailable ? 1 : 0.3 }}
          >
            {dir}
          </button>
        );
      })}
    </div>
  );
}