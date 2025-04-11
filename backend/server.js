const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const userRoutes = require('./routes/UserRoutes'); // Changed variable name to match usage below
const treeRoute = require('./routes/TreeRoute');
const domainRoutes = require('./routes/DomainRoutes');
const chapterRoutes = require('./routes/ChapterRoutes');
const dashboardRoute = require('./routes/DashboardRoute');
const quizRoutes = require('./routes/QuizRoutes');
const notificationRoutes = require('./routes/NotificationRoutes');
const messageRoutes = require('./routes/MessageRoutes');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI) // Changed from MONGO_URI to MONGODB_URI to match .env file
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => {
        console.error('MongoDB connection error:', error);
        // Show more detailed error information
        if (error.code === 'ENOTFOUND') {
            console.error('Database host not found. Check your connection string in .env file.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Database connection refused. Make sure MongoDB is running.');
        }
    });

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Routes
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body); // Add logging
    next();
});

app.use('/api/users', userRoutes);
app.use('/api/tree', treeRoute);
app.use('/api/domains', domainRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/quizzes', quizRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Start server with better error handling
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Routes registered:', app._router.stack.filter(r => r.route).map(r => r.route.path));
}).on('error', (error) => {
    console.error('Error starting server:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port or close the application using this port.`);
    }
});
