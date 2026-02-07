import { create } from 'zustand';

interface Floor { id: number; label: string; imageValue?: string; }
interface Room { id: string; floor: number; }
interface ViewImage { room: string; direction: string; filename: string; floorNum?: string; }
interface RoomPolygon { room: string; floor: number; points: string; }

interface AppState {
  currentPage: 'home' | 'floorMap';
  currentMode: 'floor' | 'room' | 'view';
  currentFloor: number | null;
  currentRoom: string | null;
  currentDirection: string | null;
  currentBuilding: number;
  zoom: number;

  csvLoaded: boolean;
  floors: Floor[];
  floorToImageVal: Map<number, string>;
  viewsByRoom: Map<string, ViewImage[]>;
  roomPolygons: Map<string, RoomPolygon[]>; // NEW: Maps "floor-room" to polygon data
  buildings: Map<number, any>;
  availability: Map<string, string>;

  connected: boolean;
  deviceAlive: boolean;
  clientId: string;
  displayName: string;
  isCasting: boolean;
  castHolderClientId: string | null;
  castHolderName: string | null;

  controlsSidebarOpen: boolean;
  relayState: { surrounding: boolean; terrace: boolean };
  lastActive: any;

  setPage: (page: 'home' | 'floorMap') => void;
  setMode: (mode: 'floor' | 'room' | 'view') => void;
  selectFloor: (floor: number | null) => void;
  selectRoom: (room: string | null) => void;
  selectDirection: (direction: string | null) => void;
  setConnected: (connected: boolean) => void;
  setDeviceAlive: (alive: boolean) => void;
  setClientIdentity: (id: string, name: string) => void;
  setCastState: (casting: boolean, holderId?: string | null, holderName?: string | null) => void;
  toggleControlsSidebar: () => void;
  updateRelayState: (relay: 'surrounding' | 'terrace', active: boolean) => void;
  loadCSVData: () => Promise<void>;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'home',
  currentMode: 'floor',
  currentFloor: null,
  currentRoom: null,
  currentDirection: null,
  currentBuilding: 1,
  zoom: 1,

  csvLoaded: false,
  floors: [],
  floorToImageVal: new Map(),
  viewsByRoom: new Map(),
  roomPolygons: new Map(),
  buildings: new Map(),
  availability: new Map(),

  connected: false,
  deviceAlive: false,
  clientId: '',
  displayName: '',
  isCasting: false,
  castHolderClientId: null,
  castHolderName: null,

  controlsSidebarOpen: false,
  relayState: { surrounding: false, terrace: false },
  lastActive: null,

  /* ---------------- Actions ---------------- */

  setPage: (page) => {
    console.log('[Store] setPage →', page);
    set({ currentPage: page });
  },

  setMode: (mode) => {
    console.log('[Store] setMode →', mode);
    set({ currentMode: mode });
  },

  selectFloor: (floor) => {
    console.log('[Store] selectFloor →', floor);
    set({
      currentFloor: floor,
      currentRoom: null,
      currentDirection: null,
      currentMode: 'floor',
      currentPage: floor ? 'floorMap' : 'home'
    });
  },

  selectRoom: (room) => {
    console.log('[Store] selectRoom →', room);
    set({
      currentRoom: room,
      currentDirection: null,
      currentMode: room ? 'room' : 'floor'
    });
  },

  selectDirection: (direction) => {
    console.log('[Store] selectDirection →', direction);
    set({
      currentDirection: direction,
      currentMode: direction ? 'view' : 'room'
    });
  },

  setConnected: (connected) => {
    console.log('[Store] MQTT connected →', connected);
    set({ connected });
  },

  setDeviceAlive: (alive) => {
    const current = get().deviceAlive;
    if (current !== alive) {
      console.log('[Store] Device alive →', alive);
      set({ deviceAlive: alive });
    }
  },

  setClientIdentity: (id, name) => {
    console.log('[Store] Client identity →', { id, name });
    set({ clientId: id, displayName: name });
  },

  setCastState: (casting, holderId, holderName) => {
    console.log('[Store] Cast state →', { casting, holderId, holderName });
    set({
      isCasting: casting,
      castHolderClientId: holderId || null,
      castHolderName: holderName || null
    });
  },

  toggleControlsSidebar: () => {
    const next = !get().controlsSidebarOpen;
    console.log('[Store] Controls sidebar →', next);
    set({ controlsSidebarOpen: next });
  },

  updateRelayState: (relay, active) => {
    console.log('[Store] Relay update →', relay, active);
    set((state) => ({
      relayState: { ...state.relayState, [relay]: active }
    }));
  },

  loadCSVData: async () => {
    try {
      console.group('[Store][CSV] loadCSVData START');

      console.log('[CSV] Fetching file → /flpx.csv');
      const flpxRes = await fetch('/flpx.csv');

      console.log('[CSV] Fetch response:', {
        ok: flpxRes.ok,
        status: flpxRes.status,
        statusText: flpxRes.statusText
      });

      const flpxText = await flpxRes.text();
      console.log('[CSV] Raw CSV length:', flpxText.length);

      const flpxLines = flpxText.trim().split('\n');
      console.log('[CSV] Total lines (including header):', flpxLines.length);

      const floorMap = new Map<number, string>();
      const viewsMap = new Map<string, ViewImage[]>();
      const polygonsMap = new Map<string, RoomPolygon[]>();
      const floorsSet = new Set<number>();

      console.log('[CSV] Parsing rows (skipping header)...');
      console.log('[CSV] Expected format: floor,image,room,room o,view,points');

      for (let i = 1; i < flpxLines.length; i++) {
        const line = flpxLines[i];

        if (!line || !line.includes(',')) {
          console.warn(`[CSV] Skipping malformed line ${i}:`, line);
          continue;
        }

        // CSV Format: floor,image,room,room o,view,points
        const parts = parseCSVLine(line);
        
        if (parts.length < 6) {
          console.warn(`[CSV] Skipping line ${i} - insufficient columns:`, parts);
          continue;
        }

        const [floorNum, imageNum, roomNum, roomOriginal, view, points] = parts;

        /* ---------- Floor mapping ---------- */
        const floor = parseInt(floorNum.trim());
        if (!Number.isNaN(floor)) {
          if (!floorsSet.has(floor)) {
            console.log(`[CSV] New floor detected → ${floor}`);
          }

          floorsSet.add(floor);

          // Map floor to image number
          if (!floorMap.has(floor)) {
            const imgVal = imageNum.trim();
            console.log(`[CSV] Mapping floor ${floor} → image ${imgVal}`);
            floorMap.set(floor, imgVal);
          }
        } else {
          console.warn(`[CSV] Invalid floor number at line ${i}:`, floorNum);
          continue;
        }

        /* ---------- Room / view mapping ---------- */
        const roomKey = roomNum.trim();

        // Initialize room views map
        if (!viewsMap.has(roomKey)) {
          viewsMap.set(roomKey, []);
        }

        // The "view" column contains directions like "N1,W1" or "N1"
        const directions = view.trim().split(',');

        // Create a view entry for each direction
        directions.forEach(direction => {
          const dir = direction.trim();
          if (dir) {
            viewsMap.get(roomKey)!.push({
              room: roomKey,
              direction: dir, // Store full direction like "N1"
              filename: `${dir[0]}/${Number.parseInt(floorNum)-2}.webp`,
              floorNum: floorNum.trim()
            });
          }
        });

        /* ---------- Polygon mapping ---------- */
        const polygonKey = `${floor}-${roomKey}`;
        if (!polygonsMap.has(polygonKey)) {
          polygonsMap.set(polygonKey, []);
        }

        polygonsMap.get(polygonKey)!.push({
          room: roomKey,
          floor: floor,
          points: points.trim()
        });

        if (i <= 5) { // Log first few entries for debugging
          console.log(
            `[CSV] Line ${i} → Floor: ${floor}, Room: ${roomKey}, Views: ${directions.join(', ')}, Points: ${points.trim().substring(0, 30)}...`
          );
        }
      }

      console.log('[CSV] Parsing complete');

      const floors = Array.from(floorsSet)
        .sort((a, b) => a - b)
        .map(id => ({
          id,
          label: getFloorLabel(id),
          imageValue: floorMap.get(id)
        }));

      console.log('[CSV] Floors generated:', floors);
      console.log('[CSV] Total unique floors:', floors.length);
      console.log('[CSV] Total unique rooms:', viewsMap.size);
      console.log('[CSV] Total polygon entries:', polygonsMap.size);

      // Log sample data
      const firstRoom = Array.from(viewsMap.keys())[0];
      if (firstRoom) {
        console.log(`[CSV] Sample room "${firstRoom}" views:`, viewsMap.get(firstRoom));
      }

      const firstPolygon = Array.from(polygonsMap.keys())[0];
      if (firstPolygon) {
        console.log(`[CSV] Sample polygon "${firstPolygon}":`, polygonsMap.get(firstPolygon));
      }

      set({
        floors,
        floorToImageVal: floorMap,
        viewsByRoom: viewsMap,
        roomPolygons: polygonsMap,
        csvLoaded: true
      });

      console.log('[Store][CSV] State updated successfully');
      console.groupEnd();

    } catch (error) {
      console.group('[Store][CSV] ERROR');
      console.error(error);
      console.groupEnd();
    }
  },

  reset: () => {
    console.log('[Store] Reset navigation state');
    set({
      currentFloor: null,
      currentRoom: null,
      currentDirection: null,
      currentMode: 'floor',
      currentPage: 'home'
    });
  }
}));

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function getFloorLabel(n: number): string {
  if (n === 1) return 'Ground Floor Commercials';
  if (n === 2) return 'First Floor Commercials';
  if (n >= 3 && n <= 15) return `Floor ${n - 2}`;
  if (n === 16) return 'Rooftop Amenities';
  if (n === 17) return 'Terrace';
  return `Floor ${n}`;
}