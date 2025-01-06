const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000', // Replace with your frontend's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Enable cookies or other credentials if required
}));

// Connect to DB
connectDB();

// Routes
app.use((req, res, next) => {
    if (req.method === 'GET' && req.headers['content-type'] === 'application/json') {
        bodyParser.json()(req, res, next);
    } else {
        next();
    }
});

app.use('/api/users', require('./routes/UserRoute'));
app.use('/api/tree', require('./routes/TreeRoute'));
app.use('/api/dashboard', require('./routes/DashboardRoute'));
app.get('/', (req, res) => {
    res.send('Backend is running!');
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
