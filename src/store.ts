import { create } from 'zustand';

interface Floor { id: number; label: string; imageValue?: string; }
interface Room { id: string; floor: number; }
interface ViewImage { room: string; direction: string; filename: string; floorNum?: string; }
interface RoomPolygon { room: string; floor: number; points: string; }
interface AvailabilityData { floor: number; room: number; status: number; }

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
  roomPolygons: Map<string, RoomPolygon[]>;
  buildings: Map<number, any>;
  availability: Map<string, number>; // NEW: key="floor-room", value=status (0=sold,1=available,2=blocked)
  availabilityList: AvailabilityData[]; // NEW: Array format for sending to ESP32

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
  availabilityList: [],

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

      // ========== Load flpx.csv ==========
      console.log('[CSV] Fetching file → /flpx.csv');
      const flpxRes = await fetch('/flpx.csv');
      const flpxText = await flpxRes.text();
      const flpxLines = flpxText.trim().split('\n');

      const floorMap = new Map<number, string>();
      const viewsMap = new Map<string, ViewImage[]>();
      const polygonsMap = new Map<string, RoomPolygon[]>();
      const floorsSet = new Set<number>();

      console.log('[CSV] Parsing flpx.csv rows (skipping header)...');

      for (let i = 1; i < flpxLines.length; i++) {
        const line = flpxLines[i];
        if (!line || !line.includes(',')) continue;

        const parts = parseCSVLine(line);
        if (parts.length < 6) continue;

        const [floorNum, imageNum, roomNum, roomOriginal, view, points] = parts;

        // Floor mapping
        const floor = parseInt(floorNum.trim());
        if (!Number.isNaN(floor)) {
          floorsSet.add(floor);
          if (!floorMap.has(floor)) {
            floorMap.set(floor, imageNum.trim());
          }
        } else {
          continue;
        }

        // Room / view mapping
        const roomKey = roomNum.trim();
        if (!viewsMap.has(roomKey)) {
          viewsMap.set(roomKey, []);
        }

        const directions = view.trim().split(',');
        directions.forEach(direction => {
          const dir = direction.trim();
          if (dir) {
            viewsMap.get(roomKey)!.push({
              room: roomKey,
              direction: dir,
              filename: `${dir[0]}/${Number.parseInt(floorNum)-2}.webp`,
              floorNum: floorNum.trim()
            });
          }
        });

        // Polygon mapping
        const polygonKey = `${floor}-${roomKey}`;
        if (!polygonsMap.has(polygonKey)) {
          polygonsMap.set(polygonKey, []);
        }

        polygonsMap.get(polygonKey)!.push({
          room: roomKey,
          floor: floor,
          points: points.trim()
        });
      }

      const floors = Array.from(floorsSet)
        .sort((a, b) => a - b)
        .map(id => ({
          id,
          label: getFloorLabel(id),
          imageValue: floorMap.get(id)
        }));

      console.log('[CSV] flpx.csv parsed:', {
        floors: floors.length,
        rooms: viewsMap.size,
        polygons: polygonsMap.size
      });

      // ========== Load availability.csv (NEW) ==========
      console.log('[CSV] Fetching file → /availability.csv');
      const availRes = await fetch('/availability.csv');
      
      if (!availRes.ok) {
        console.warn('[CSV] availability.csv not found or error:', availRes.status);
      } else {
        const availText = await availRes.text();
        const availLines = availText.trim().split('\n');
        
        const availMap = new Map<string, number>();
        const availList: AvailabilityData[] = [];

        console.log('[CSV] Parsing availability.csv rows (skipping header)...');

        for (let i = 1; i < availLines.length; i++) {
          const line = availLines[i];
          if (!line || !line.includes(',')) continue;

          const parts = line.split(',').map(p => p.trim());
          if (parts.length < 4) continue;

          const [buildingId, floorId, roomId, status] = parts;
          
          const floor = parseInt(floorId);
          const room = parseInt(roomId);
          const statusCode = parseInt(status);

          if (!Number.isNaN(floor) && !Number.isNaN(room) && !Number.isNaN(statusCode)) {
            const key = `${floor}-${room}`;
            availMap.set(key, statusCode);
            
            // Also create array format for sending to ESP32
            availList.push({
              floor: floor,
              room: room,
              status: statusCode
            });
          }
        }

        console.log('[CSV] availability.csv parsed:', {
          entries: availMap.size,
          available: availList.filter(a => a.status === 1).length,
          blocked: availList.filter(a => a.status === 2).length,
          sold: availList.filter(a => a.status === 0).length
        });

        // Update state with availability data
        set({
          floors,
          floorToImageVal: floorMap,
          viewsByRoom: viewsMap,
          roomPolygons: polygonsMap,
          availability: availMap,
          availabilityList: availList,
          csvLoaded: true
        });

        console.log('[Store][CSV] State updated successfully with availability data');
      }

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
