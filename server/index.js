// server/index.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Path to CSV file
const CSV_PATH = path.join(__dirname, '..', 'public', 'availability.csv');

console.log('[Server] CSV Path:', CSV_PATH);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Get availability data
app.get('/api/availability', (req, res) => {
  try {
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    res.type('text/csv').send(csvContent);
  } catch (error) {
    console.error('[API] Error reading CSV:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update availability endpoint
app.post('/api/update-availability', (req, res) => {
  const { building_id, floor_id, room_id, status } = req.body;
  
  console.log('[API] Update request:', { building_id, floor_id, room_id, status });
  
  // Validate input
  if (!building_id || !floor_id || !room_id || status === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields' 
    });
  }
  
  try {
    // Read CSV file
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = csvContent.split('\n');
    
    // Find and update the line
    let updated = false;
    const updatedLines = lines.map(line => {
      if (!line.trim() || line.startsWith('building_id')) {
        return line; // Keep header and empty lines
      }
      
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 4) return line;
      
      const [bid, fid, rid, oldStatus] = parts;
      
      if (parseInt(bid) === building_id && 
          parseInt(fid) === floor_id && 
          parseInt(rid) === room_id) {
        updated = true;
        console.log(`[API] Updating: Floor ${fid}, Room ${rid}: ${oldStatus} → ${status}`);
        return `${bid},${fid},${rid},${status}`;
      }
      
      return line;
    });
    
    if (!updated) {
      console.log('[API] ⚠️  Room not found in CSV');
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found in CSV' 
      });
    }
    
    // Write back to CSV
    fs.writeFileSync(CSV_PATH, updatedLines.join('\n'), 'utf8');
    
    console.log('[API] ✅ CSV updated successfully');
    
    res.json({ 
      success: true, 
      message: 'Availability updated successfully',
      data: { building_id, floor_id, room_id, status }
    });
    
  } catch (error) {
    console.error('[API] ❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  🚀 JP Infra API Server Running               ║
║                                                ║
║  URL: http://localhost:${PORT}                    ║
║  Health: http://localhost:${PORT}/api/health      ║
╚════════════════════════════════════════════════╝
  `);
});