const express = require('express');
const path = require('path');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/subjects', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subjects.html'));
});

app.get('/math', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'math.html'));
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
    console.log('🎉 MindSpark website server is running!');
    console.log('==========================================');
    console.log(`🌐 Local access:    http://localhost:${PORT}`);
    console.log(`📱 Network access:  http://${localIP}:${PORT}`);
    console.log('==========================================');
    console.log('Welcome to the MindSpark learning space!');
    console.log('');
    console.log('💡 Other devices on your network can access:');
    console.log(`   http://${localIP}:${PORT}`);
}); 