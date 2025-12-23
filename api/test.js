// Test endpoint to verify serverless functions are working
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    message: 'Serverless function is working!',
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'] || 'unknown'
  });
}

