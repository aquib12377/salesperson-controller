const URL  = import.meta.env.VITE_MQTT_URL  || "wss://mqtt.modelsofbrainwing.com:8883/mqtt";
const USER = import.meta.env.VITE_MQTT_USER || "reactuser";
const PASS = import.meta.env.VITE_MQTT_PASS || "scaleModel";

export const PROJECT = import.meta.env.VITE_MQTT_PROJECT || "platinum";
export const t = (path: string): string => `${PROJECT}/${path}`;

let client: any;
let loadingPromise: Promise<any> | null = null;

function loadMqttUmd(): Promise<any> {
  if (typeof window !== "undefined" && (window as any).mqtt) {
    return Promise.resolve((window as any).mqtt);
  }
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/mqtt/dist/mqtt.min.js";
    s.async = true;
    s.onload = () => resolve((window as any).mqtt);
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
  return loadingPromise;
}

export async function getClient(): Promise<any> {
  if (client) return client;
  
  const mqtt = await loadMqttUmd();

  client = mqtt.connect(URL, {
    username: USER,
    password: PASS,
    protocolVersion: 4,
    reconnectPeriod: 1500,
    connectTimeout: 10_000,
    keepalive: 25,
    clean: true,
  });

  try { (window as any).__mqtt_client_ref = client; } catch {}

  client.on('connect', () => {
    console.log('[MQTT] ✅ Connected');
  });

  client.on('error', (err: Error) => {
    console.error('[MQTT] ❌ Error:', err);
  });

  return client;
}

export async function publish(
  topic: string, 
  payload: string | object, 
  opts: { qos?: 0 | 1 | 2; retain?: boolean } = { qos: 0, retain: false }
): Promise<void> {
  const c = await getClient();
  const msg = typeof payload === "string" ? payload : JSON.stringify(payload);
  
  console.log('[MQTT] Publishing to', topic, ':', payload);
  
  if (c.connected) {
    c.publish(topic, msg, opts);
  } else {
    c.once("connect", () => c.publish(topic, msg, opts));
  }
}

export async function subscribe(topic: string, opts: { qos?: 0 | 1 | 2 } = { qos: 0 }): Promise<void> {
  const c = await getClient();
  
  if (c.connected) {
    c.subscribe(topic, opts);
    console.log('[MQTT] Subscribed to:', topic);
  } else {
    c.once("connect", () => {
      c.subscribe(topic, opts);
      console.log('[MQTT] Subscribed to:', topic);
    });
  }
}

export async function onMessage(handler: (topic: string, message: Buffer) => void): Promise<void> {
  const c = await getClient();
  c.on("message", handler);
}

let lastAckTs = 0;
let hbTimer: NodeJS.Timeout | null = null;

export function recordAck(): void {
  lastAckTs = Date.now();
}

export function isDeviceAlive(withinMs: number = 12_000): boolean {
  return Date.now() - lastAckTs <= withinMs;
}

export function startHeartbeat(intervalMs: number = 5_000): () => void {
  stopHeartbeat();
  hbTimer = setInterval(() => {
    publish(t("ui/cmd"), { type: "ping", ts: Date.now() });
  }, intervalMs);
  return stopHeartbeat;
}

export function stopHeartbeat(): void {
  if (hbTimer) clearInterval(hbTimer);
  hbTimer = null;
}

// FIXED: Send cast state directly to cast/state topic with retain
export async function sendCastRequest(imageSrc: string, metadata: any, holderName: string): Promise<void> {
  const clientId = localStorage.getItem('cast_client_id') || '';
  
  const castState = {
    active: true,
    holderClientId: clientId,
    holderName: holderName,
    imageSrc: imageSrc,
    metadata: metadata,
    ts: Date.now()
  };
  
  console.log('[MQTT] Sending cast request:', castState);
  
  // Publish to cast/state with RETAIN flag
  await publish(t("cast/state"), castState, { qos: 0, retain: true });
}

export async function sendCastRelease(): Promise<void> {
  const castState = {
    active: false,
    holderClientId: null,
    holderName: null,
    imageSrc: null,
    metadata: null,
    ts: Date.now()
  };
  
  console.log('[MQTT] Releasing cast');
  
  // Publish to cast/state with RETAIN flag
  await publish(t("cast/state"), castState, { qos: 0, retain: true });
}

export async function sendCommand(type: string, data: any = {}): Promise<void> {
  const clientId = localStorage.getItem('cast_client_id') || '';
  const clientName = localStorage.getItem('salesperson_name') || 'Salesperson';
  
  const payload = {
    type,
    ...data,
    clientId,
    clientName,
    ts: Date.now()
  };
  
  await publish(t("ui/cmd"), payload);
  console.log('[MQTT] Sent command:', type, data);
}
