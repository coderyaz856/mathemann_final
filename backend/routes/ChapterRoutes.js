const express = require('express');
const router = express.Router();
const Chapter = require('../models/Chapter');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Get a chapter by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const chapterId = req.params.id;
        
        const chapter = await Chapter.findById(chapterId);

        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        res.status(200).json(chapter);
    } catch (error) {
        console.error('Error fetching chapter:', error);
        res.status(500).json({ message: 'Error retrieving chapter data' });
    }
});

module.exports = router;
