import { useAppStore } from '../store';
import { sendCommand } from '../mqtt';

export default function FloorSelector() {
  const { floors, currentFloor, selectFloor } = useAppStore();

  const handleFloorClick = async (floorId: number) => {
    console.log(`[FloorSelector] Floor ${floorId} clicked`);

    // Navigate to floor
    selectFloor(floorId);

    // Send LED command to turn floor ON (white)
    // Skip commercial floors (1, 2) and amenities (16)
    if (floorId >= 3 && floorId <= 15) {
      console.log(`[FloorSelector] Sending LED command for floor ${floorId}`);
      if (floorId === 15) {
        sendCommand('relay_toggle', { relay: 'terrace' });
      }
      else {
        await sendCommand('set_floor_color', { floor: floorId });
      }
    } else {
      console.log(`[FloorSelector] Skipping LED command for special floor ${floorId}`);
    }
  };

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