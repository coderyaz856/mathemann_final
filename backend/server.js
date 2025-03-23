const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();
const cors = require('cors');
const UserRoute = require('./routes/UserRoute');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Connect to DB
connectDB();

// Routes
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body); // Add logging
    next();
});

app.use('/api/users', UserRoute);
app.use('/api/tree', require('./routes/TreeRoute'));
app.use('/api/dashboard', require('./routes/DashboardRoute'));
app.use('/api/chapters', require('./routes/ChapterRoutes'));
app.use('/api/quizzes', require('./routes/QuizRoutes')); // Add the quiz routes

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Routes registered:', app._router.stack.filter(r => r.route).map(r => r.route.path));
});
