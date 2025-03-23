const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserRole,
    register
} = require('../controllers/UserController');

// Login route with better error handling
router.post('/login', async (req, res) => {
    console.log("Login request received:", req.body);
    const { email, password } = req.body;

    try {
        // First try to find user as Student
        let user = await Student.findOne({ email })
            .populate('studies.chapter');

        // If not found as Student, try regular User
        if (!user) {
            user = await User.findOne({ email });
        }

        console.log("Found user:", user);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return complete response
        return res.status(200).json({
            success: true,
            token,
            userRole: user.role,
            userName: user.name,
            userId: user._id,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during login",
            error: error.message
        });
    }
});

// Add new profile route
router.get('/profile', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        let user = await Student.findById(userId)
            .select('-password')
            .populate('studies.chapter');

        if (!user) {
            user = await User.findById(userId).select('-password');
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Add teachers route - get all teachers
router.get('/teachers', async (req, res) => {
    try {
        // Get token from request header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Fetch all teachers
            const teachers = await User.find({ role: 'teacher' })
                .select('-password') // Don't send password
                .lean(); // Convert to regular JS object
            
            // Add domains and bio (would normally come from database)
            const teachersWithDomains = teachers.map(teacher => {
                return {
                    ...teacher,
                    // Mock domains - in a real app, these would come from the database
                    domains: [], // Will be populated via frontend logic based on domains student is studying
                    bio: `Experienced educator specializing in ${teacher.subject || "Mathematics"}.`
                };
            });
            
            return res.status(200).json(teachersWithDomains);
        } catch (error) {
            console.error('JWT verification error:', error);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Error fetching teachers:', error);
        return res.status(500).json({ message: 'Error fetching teachers', error: error.message });
    }
});

// Protected routes
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
// Route to fetch user role by email
router.get('/role/:email', getUserRole);

router.post('/register', register);

module.exports = router;
