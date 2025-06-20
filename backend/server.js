const express = require('express');
const cors = require('cors'); // Corrected require
const db = require('./database.js');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

app.get('/', (req, res) => {
    res.send('Backend server is running!');
});

// Placeholder for future routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const copingBoxRoutes = require('./routes/copingBoxRoutes');
app.use('/api/copingbox', copingBoxRoutes);

const journalRoutes = require('./routes/journalRoutes');
app.use('/api/journal', journalRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
