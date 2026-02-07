import { useAppStore } from '../store';

/**
 * Calculate room number based on floor and room
 * Floor 1 (Ground): Room 1 → 101, Room 5 → 105
 * Floor 2 (First): Room 3 → 203, Room 7 → 207  
 * Floor 3+ (Residential): Room 1 → 301, Room 8 → 308
 */
function getRoomNumber(floor: number, room: string): string {
  const roomNum = parseInt(room);
  if(floor === 1 || floor === 2) {
    return ``;
  }
  return `${floor-2}${roomNum.toString().padStart(2, '0')}`;
}

/**
 * Calculate centroid of polygon for label placement
 */
function getPolygonCenter(points: string): { x: number; y: number } {
  const coords = points.trim().split(' ').map(pair => {
    const [x, y] = pair.split(',').map(Number);
    return { x, y };
  });

  if (coords.length === 0) return { x: 0, y: 0 };

  const sum = coords.reduce(
    (acc, coord) => ({
      x: acc.x + coord.x,
      y: acc.y + coord.y
    }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / coords.length,
    y: sum.y / coords.length
  };
}

export default function PolygonOverlay() {
  const { selectRoom, roomPolygons, currentFloor, currentRoom } = useAppStore();

  if (!currentFloor) {
    console.warn('[PolygonOverlay] No current floor selected');
    return null;
  }

  // Get all room polygons for the current floor
  const floorRooms: Array<{ room: string; points: string }> = [];
  
  roomPolygons.forEach((polygons, key) => {
    // Key format is "floor-room"
    const [floorStr, room] = key.split('-');
    const floor = parseInt(floorStr);
    
    if (floor === currentFloor) {
      polygons.forEach(poly => {
        floorRooms.push({
          room: poly.room,
          points: poly.points
        });
      });
    }
  });

  console.log(`[PolygonOverlay] Floor ${currentFloor} has ${floorRooms.length} room polygons`);

  if (floorRooms.length === 0) {
    console.warn(`[PolygonOverlay] No polygons found for floor ${currentFloor}`);
    return null;
  }

  return (
    <svg 
      className="polygon-overlay" 
      viewBox="0 0 1152 680" 
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Define styles for polygons and labels */}
      <defs>
        <style>{`
          .room-polygon {
            fill: rgba(59, 130, 246, 0.2);
            stroke: rgba(59, 130, 246, 0.6);
            stroke-width: 2;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .room-polygon:hover {
            fill: rgba(59, 130, 246, 0.4);
            stroke: rgba(59, 130, 246, 1);
            stroke-width: 3;
          }
          .room-polygon.selected {
            fill: rgba(34, 197, 94, 0.3);
            stroke: rgba(34, 197, 94, 1);
            stroke-width: 3;
          }
          .room-label {
            fill: white;
            font-size: 24px;
            font-weight: bold;
            font-family: system-ui, -apple-system, sans-serif;
            text-anchor: middle;
            dominant-baseline: middle;
            pointer-events: none;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          }
        `}</style>
      </defs>

      {floorRooms.map((roomData, index) => {
        const center = getPolygonCenter(roomData.points);
        const roomNumber = getRoomNumber(currentFloor, roomData.room);
        const isSelected = currentRoom === roomData.room;

        return (
          <g key={`${roomData.room}-${index}`}>
            {/* Polygon */}
            <polygon
              points={roomData.points}
              onClick={() => {
                console.log(`[PolygonOverlay] Room ${roomData.room} (${roomNumber}) clicked`);
                selectRoom(roomData.room);
              }}
              className={`room-polygon ${isSelected ? 'selected' : ''}`}
              data-room={roomData.room}
              data-room-number={roomNumber}
            />
            
            {/* Room number label */}
            <text
              x={center.x}
              y={center.y}
              className="room-label"
            >
              {roomNumber}
            </text>
          </g>
        );
      })}
    </svg>
  );
}