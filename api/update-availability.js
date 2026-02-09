// api/update-availability.js
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept,Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { building_id, floor_id, room_id, status } = req.body;

  console.log('[Vercel API] Update request:', { building_id, floor_id, room_id, status });

  // Validate input
  if (!building_id || !floor_id || !room_id || status === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: building_id, floor_id, room_id, status' 
    });
  }

  try {
    // Path to CSV file in Vercel deployment
    const CSV_PATH = path.join(process.cwd(), 'public', 'availability.csv');
    
    console.log('[Vercel API] CSV Path:', CSV_PATH);
    
    // Check if file exists
    if (!fs.existsSync(CSV_PATH)) {
      console.error('[Vercel API] CSV file not found at:', CSV_PATH);
      return res.status(500).json({ 
        success: false, 
        message: 'CSV file not found' 
      });
    }

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
        console.log(`[Vercel API] Updating: Floor ${fid}, Room ${rid}: ${oldStatus} → ${status}`);
        return `${bid},${fid},${rid},${status}`;
      }

      return line;
    });

    if (!updated) {
      console.log('[Vercel API] ⚠️ Room not found in CSV');
      return res.status(404).json({ 
        success: false, 
        message: `Room not found: Building ${building_id}, Floor ${floor_id}, Room ${room_id}` 
      });
    }

    // Write back to CSV
    fs.writeFileSync(CSV_PATH, updatedLines.join('\n'), 'utf8');

    console.log('[Vercel API] ✅ CSV updated successfully');

    return res.status(200).json({ 
      success: true, 
      message: 'Availability updated successfully',
      data: { building_id, floor_id, room_id, status }
    });

  } catch (error) {
    console.error('[Vercel API] ❌ Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};