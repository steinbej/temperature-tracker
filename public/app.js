// DOM elements
const form = document.getElementById('reading-form');
const roomSelect = document.getElementById('room');
const temperatureInput = document.getElementById('temperature');
const humidityInput = document.getElementById('humidity');
const readingsTable = document.getElementById('readings-table').querySelector('tbody');
const emailInput = document.getElementById('email');
const emailExportBtn = document.getElementById('email-export-btn');
const dateInput = document.getElementById('date-input');
const timeInput = document.getElementById('time-input');
const clockBtn = document.getElementById('clock-btn');

// Function to set the date and time inputs to current date and time
function setDatetimeToNow() {
    const now = new Date();
    
    // Format date: YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    // Format time: HH:MM
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    
    dateInput.value = formattedDate;
    timeInput.value = formattedTime;
}

// Load all readings when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set default date and time
    setDatetimeToNow();
    
    // Load the readings from database
    loadReadings();
    
    // Set up the time picker functionality
    setupTimePicker();
});

// Handle form submission
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Combine date and time inputs into a single ISO string
    const dateValue = dateInput.value;
    const timeValue = timeInput.value;
    const datetimeString = dateValue && timeValue ? `${dateValue}T${timeValue}` : null;
    
    const reading = {
        room: roomSelect.value,
        temperature: parseFloat(temperatureInput.value),
        humidity: parseFloat(humidityInput.value),
        datetime: datetimeString
    };
    
    addReading(reading);
});

// Email export button click handler
emailExportBtn.addEventListener('click', function() {
    const email = emailInput.value.trim();
    if (!email) {
        alert('Please enter an email address');
        return;
    }
    
    if (!validateEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // In a real application, you would send this to your server
    // For now, we'll just download the CSV
    alert(`CSV would be sent to ${email} in a production environment. Downloading instead.`);
    window.location.href = '/api/export';
});

// Function to load all readings
function loadReadings() {
    fetch('/api/readings')
        .then(response => response.json())
        .then(data => {
            displayReadings(data.data);
        })
        .catch(error => {
            console.error('Error loading readings:', error);
        });
}

// Function to add a new reading
function addReading(reading) {
    fetch('/api/readings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reading)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Clear form fields
        form.reset();
        
        // Set default date and time again
        setDatetimeToNow();
        
        // Refresh readings
        loadReadings();
    })
    .catch(error => {
        console.error('Error adding reading:', error);
    });
}

// Function to display readings in the table
function displayReadings(readings) {
    readingsTable.innerHTML = '';
    
    readings.forEach(reading => {
        const row = document.createElement('tr');
        row.dataset.id = reading.id;
        
        // Format date with shorter format for mobile
const date = new Date(reading.timestamp);
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const year = String(date.getFullYear()).slice(2); // Just the last 2 digits
const hours = String(date.getHours()).padStart(2, '0');
const minutes = String(date.getMinutes()).padStart(2, '0');
const formattedDate = `${month}/${day}/${year} ${hours}:${minutes}`;
        
        // Truncate room name to first 4 characters
const shortRoomName = reading.room.substring(0, 4);

row.innerHTML = `
    <td>${formattedDate}</td>
    <td>${shortRoomName}</td>
    <td>${reading.temperature} °F</td>
    <td>${reading.humidity} %</td>
    <td><button class="btn-delete" onclick="deleteReading(${reading.id})">Del</button></td>
`;
        
        readingsTable.appendChild(row);
    });
}

// Function to delete a reading
function deleteReading(id) {
    if (!confirm('Are you sure you want to delete this reading?')) {
        return;
    }
    
    fetch(`/api/readings/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Refresh readings
        loadReadings();
    })
    .catch(error => {
        console.error('Error deleting reading:', error);
    });
}

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Setup time picker functionality
function setupTimePicker() {
    if (!clockBtn) return;
    
    const timePickerOverlay = document.getElementById('time-picker-overlay');
    const closePicker = document.getElementById('close-picker');
    const applyTime = document.getElementById('apply-time');
    const hoursDisplay = document.getElementById('hours-display');
    const minutesDisplay = document.getElementById('minutes-display');
    const periodDisplay = document.getElementById('period-display');
    
    if (!timePickerOverlay || !hoursDisplay || !minutesDisplay || !periodDisplay) return;
    
    // Current picker values
    let currentHours = 12;
    let currentMinutes = 0;
    let currentPeriod = 'AM';
    
    // Update the time picker display
    function updateTimePickerDisplay() {
        hoursDisplay.textContent = String(currentHours);
        minutesDisplay.textContent = String(currentMinutes).padStart(2, '0');
        periodDisplay.textContent = currentPeriod;
    }
    
    // Open time picker
    clockBtn.addEventListener('click', function() {
        const timeValue = timeInput.value;
        if (timeValue) {
            const [hours, minutes] = timeValue.split(':');
            let hoursNum = parseInt(hours);
            
            // Convert to 12-hour format
            if (hoursNum === 0) {
                currentHours = 12;
                currentPeriod = 'AM';
            } else if (hoursNum === 12) {
                currentHours = 12;
                currentPeriod = 'PM';
            } else if (hoursNum > 12) {
                currentHours = hoursNum - 12;
                currentPeriod = 'PM';
            } else {
                currentHours = hoursNum;
                currentPeriod = 'AM';
            }
            
            currentMinutes = parseInt(minutes);
        } else {
            // Default to current time
            const now = new Date();
            currentHours = now.getHours();
            if (currentHours === 0) {
                currentHours = 12;
                currentPeriod = 'AM';
            } else if (currentHours === 12) {
                currentPeriod = 'PM';
            } else if (currentHours > 12) {
                currentHours -= 12;
                currentPeriod = 'PM';
            } else {
                currentPeriod = 'AM';
            }
            currentMinutes = now.getMinutes();
        }
        
        // Update the display
        updateTimePickerDisplay();
        
        // Show the overlay
        timePickerOverlay.style.display = 'flex';
    });
    
    // Close time picker
    if (closePicker) {
        closePicker.addEventListener('click', function() {
            timePickerOverlay.style.display = 'none';
        });
    }
    
    // Click outside to close
    timePickerOverlay.addEventListener('click', function(e) {
        if (e.target === timePickerOverlay) {
            timePickerOverlay.style.display = 'none';
        }
    });
    
    // Handle time selection buttons
    document.querySelectorAll('.arrow-btn').forEach(button => {
        button.addEventListener('click', function() {
            const direction = this.dataset.direction;
            const target = this.dataset.target;
            
            if (target === 'hours') {
                if (direction === 'up') {
                    currentHours = currentHours === 12 ? 1 : currentHours + 1;
                } else {
                    currentHours = currentHours === 1 ? 12 : currentHours - 1;
                }
            } else if (target === 'minutes') {
                if (direction === 'up') {
                    currentMinutes = (currentMinutes + 5) % 60;
                } else {
                    currentMinutes = (currentMinutes - 5 + 60) % 60;
                }
            } else if (target === 'period') {
                currentPeriod = currentPeriod === 'AM' ? 'PM' : 'AM';
            }
            
            updateTimePickerDisplay();
        });
    });
    
    // Apply selected time
    if (applyTime) {
        applyTime.addEventListener('click', function() {
            // Convert to 24-hour format for the input
            let hours24 = currentHours;
            if (currentPeriod === 'PM' && currentHours !== 12) {
                hours24 += 12;
            } else if (currentPeriod === 'AM' && currentHours === 12) {
                hours24 = 0;
            }
            
            // Format the time and set the input value
            const formattedTime = `${String(hours24).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
            timeInput.value = formattedTime;
            
            // Close the picker
            timePickerOverlay.style.display = 'none';
        });
    }
}