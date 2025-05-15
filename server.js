const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { db, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } = require('./firebase');
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

// API endpoint to get all readings
app.get('/api/readings', async (req, res) => {
    try {
        const readingsRef = collection(db, 'readings');
        const q = query(readingsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const readings = [];
        querySnapshot.forEach((doc) => {
            readings.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json({ data: readings });
    } catch (error) {
        console.error('Error getting readings:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to add a new reading
app.post('/api/readings', async (req, res) => {
    const { room, temperature, humidity, datetime } = req.body;
    
    if (!room || temperature === undefined || humidity === undefined) {
        return res.status(400).json({ error: 'Room, temperature, and humidity are required' });
    }
    
    // Use provided datetime or current timestamp
    const timestamp = datetime || new Date().toISOString();
    
    try {
        const readingsRef = collection(db, 'readings');
        const newReading = {
            room,
            temperature: parseFloat(temperature),
            humidity: parseFloat(humidity),
            timestamp
        };
        
        const docRef = await addDoc(readingsRef, newReading);
        
        res.json({ 
            data: { 
                id: docRef.id, 
                ...newReading 
            }, 
            message: 'Reading added successfully' 
        });
    } catch (error) {
        console.error('Error adding reading:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to export data as CSV
app.get('/api/export', async (req, res) => {
    try {
        const readingsRef = collection(db, 'readings');
        const q = query(readingsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        // Convert data to CSV format
        let csv = 'Room,Temperature,Humidity,Date & Time\n';
        
        querySnapshot.forEach((doc) => {
            const reading = doc.data();
            csv += `"${reading.room}",${reading.temperature},${reading.humidity},"${reading.timestamp}"\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=temperature_readings.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting readings:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to delete a reading
app.delete('/api/readings/:id', async (req, res) => {
    const id = req.params.id;
    
    try {
        const readingRef = doc(db, 'readings', id);
        await deleteDoc(readingRef);
        
        res.json({ message: 'Reading deleted successfully' });
    } catch (error) {
        console.error('Error deleting reading:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});