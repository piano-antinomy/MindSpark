const express = require('express');
const path = require('path');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// API routes (if any)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MindSpark API is running' });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Function to get local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIPAddress();
    console.log('🎉 MindSpark React website server is running!');
    console.log('==========================================');
    console.log(`🌐 Local access:    http://localhost:${PORT}`);
    console.log(`📱 Network access:  http://${localIP}:${PORT}`);
    console.log('==========================================');
    console.log('Welcome to the MindSpark learning space!');
    console.log('');
    console.log('💡 Other devices on your network can access:');
    console.log(`   http://${localIP}:${PORT}`);
    console.log('');
    console.log('📝 Note: Make sure to run "npm run build" before starting the server');
}); 