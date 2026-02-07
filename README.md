# Salesperson Controller

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add CSV files to `/public`:
- config.csv
- availability.csv  
- flpx.csv

3. Add images to `/public`:
- `/floors` - Floor maps
- `/rooms` - Room images
- `/view` - Direction views

4. Run:
```bash
npm run dev
```

## UI Pages

- **Home** - Main menu with Floor Map & LED Controls buttons
- **Floor Map** - Interactive floor viewer with:
  - Context breadcrumb bar
  - Floor selector (right sidebar)
  - Main image viewer
  - SVG polygon overlay (clickable rooms)
  - Direction buttons (room views)
  - Cast button

## Controls Sidebar

Slide-in overlay with:
- Pattern controls
- Relay toggles  
- Availability filters

Access via "LED Controls" button on home page.

## Troubleshooting MQTT Connection

### Check Console Logs

Open browser console (F12) and look for:
```
[MQTT] Connecting to: wss://mqtt.modelsofbrainwing.com:8883/mqtt
[MQTT] User: reactuser
[MQTT] ✅ Connected successfully
```

### Common Issues

1. **MQTT Library Not Loading**
   - Check network tab for `mqtt.min.js` 
   - Should load from: `https://cdn.jsdelivr.net/npm/mqtt/dist/mqtt.min.js`

2. **Connection Refused**
   - Verify broker is running: `wss://mqtt.modelsofbrainwing.com:8883`
   - Check firewall allows WebSocket connections
   - Verify credentials in `.env` file

3. **Environment Variables Not Loading**
   - Make sure `.env` file exists in root
   - Restart dev server: `npm run dev`
   - Vite requires `VITE_` prefix for env vars

4. **Testing MQTT Connection**
   - Open browser console
   - Check `window.__mqtt_client_ref` object
   - Look for connection errors

### Manual Test

```javascript
// In browser console
const client = window.__mqtt_client_ref;
console.log('Connected:', client?.connected);
console.log('Options:', client?.options);
```

### Compare with Working Project

Your working Platinum project uses same credentials:
- URL: `wss://mqtt.modelsofbrainwing.com:8883/mqtt`
- User: `reactuser`
- Pass: `scaleModel`
- Project: `platinum`

If it works there but not here, check:
1. Both using same MQTT.js version
2. Same browser (CORS, WebSocket support)
3. Same network (firewall, proxy)
