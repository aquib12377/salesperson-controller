import { useAppStore } from '../store';

export default function FloorSelector() {
  const { floors, currentFloor, selectFloor } = useAppStore();

  return (
    <div className="floor-selector">
      <h3 className="floor-selector-title">Floors</h3>
      <div className="floor-buttons">
        {floors.map(floor => (
          <button
            key={floor.id}
            onClick={() => selectFloor(floor.id)}
            className={`floor-btn ${currentFloor === floor.id ? 'active' : ''}`}
          >
            {floor.label}
          </button>
        ))}
      </div>
    </div>
  );
}
