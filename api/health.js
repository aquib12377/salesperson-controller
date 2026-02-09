// api/health.js
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({ 
    status: 'ok', 
    message: 'JP Infra API is running on Vercel',
    timestamp: new Date().toISOString()
  });
};