const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Profile route without middleware
router.get('/profile', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Verify token and get user ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Try to find user as Student first
        let user = await Student.findById(userId)
            .select('-password')
            .populate('studies.chapter');

        if (!user) {
            // If not found as Student, try regular User
            user = await User.findById(userId).select('-password');
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Format the response
        const profile = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            birthday: user.birthday,
            studies: user.studies || [],
            joinedDate: user._id.getTimestamp(),
            lastActive: new Date()
        };

        res.status(200).json(profile);

    } catch (error) {
        console.error('Profile error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: "Error fetching profile data" });
    }
});

module.exports = router;
