const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Tree = require('../models/Tree');

// GET route for fetching the tree
router.get('/student', async (req, res) => {
    const { email, password } = req.body; // Extract credentials from the body

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || user.role !== 'student') {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.password !== password) { // Plaintext comparison (as hashing is disabled)
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Fetch the tree data for the student
        const tree = await Tree.findOne({});
        if (!tree) {
            return res.status(404).json({ message: 'Tree data not found' });
        }

        res.status(200).json(tree);
    } catch (error) {
        console.error('Error fetching tree:', error);
        res.status(500).json({ message: 'Error fetching student dashboard', error: error.message });
    }
});

module.exports = router;
