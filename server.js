const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize express app
const app = express();
// const PORT = 3000;
// was line above when written for Mac folder testing, updating to below for Render
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database');
        
        // Create table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room TEXT NOT NULL,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// API endpoint to get all readings
app.get('/api/readings', (req, res) => {
    db.all('SELECT * FROM readings ORDER BY timestamp DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// API endpoint to add a new reading
app.post('/api/readings', (req, res) => {
    const { room, temperature, humidity, datetime } = req.body;
    
    if (!room || temperature === undefined || humidity === undefined) {
        return res.status(400).json({ error: 'Room, temperature, and humidity are required' });
    }
    
    // Use provided datetime or current timestamp
    const timestamp = datetime || new Date().toISOString();
    
    const sql = 'INSERT INTO readings (room, temperature, humidity, timestamp) VALUES (?, ?, ?, ?)';
    db.run(sql, [room, temperature, humidity, timestamp], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Get the newly inserted reading
        db.get('SELECT * FROM readings WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ data: row, message: 'Reading added successfully' });
        });
    });
});

// API endpoint to export data as CSV
app.get('/api/export', (req, res) => {
    db.all('SELECT room, temperature, humidity, timestamp FROM readings ORDER BY timestamp DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Convert data to CSV format
        let csv = 'Room,Temperature,Humidity,Date & Time\n';
        rows.forEach(row => {
            csv += `"${row.room}",${row.temperature},${row.humidity},"${row.timestamp}"\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=temperature_readings.csv');
        res.send(csv);
    });
});

// API endpoint to delete a reading
app.delete('/api/readings/:id', (req, res) => {
    const id = req.params.id;
    
    const sql = 'DELETE FROM readings WHERE id = ?';
    db.run(sql, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Reading not found' });
            return;
        }
        
        res.json({ message: 'Reading deleted successfully' });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});