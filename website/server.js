const express = require('express');
const path = require('path');
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

app.listen(PORT, () => {
    console.log(`MindSpark website server running on http://localhost:${PORT}`);
    console.log('Welcome to the MindSpark learning space!');
}); 