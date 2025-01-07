const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tree = require('../models/Tree');

// Helper function to calculate age
const calculateAge = (birthday) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// GET route for student dashboard
router.get('/student', async (req, res) => {
    const { email, password } = req.query; // Extract credentials

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || user.role !== 'student') {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare provided password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Calculate the student's age
        const age = calculateAge(user.birthday);

        // Fetch the entire tree structure
        const tree = await Tree.findOne().populate({
            path: 'ageRanges.domains',
            populate: { path: 'chapters' },
        });

        if (!tree) {
            return res.status(404).json({ message: 'Tree structure not found' });
        }

        // Find the matching age range using the algorithm
        const matchingRange = tree.ageRanges.find((range) => {
            const [min, max] = range.range.split('-').map(Number); // Parse range boundaries
            return age >= min && age <= max; // Check if the age is within the range
        });

        if (!matchingRange) {
            return res.status(404).json({ message: 'Tree data not found for your age range' });
        }

        // Debug: Log the details of the matching range
        console.log(`User: ${user.name}, Age: ${age}, Matching Range: ${matchingRange.range}`);

        // Return the matching range with domains and chapters
        res.status(200).json({
            range: matchingRange.range,
            domains: matchingRange.domains,
        });
    } catch (error) {
        console.error('Error fetching student dashboard:', error);
        res.status(500).json({ message: 'Error fetching student dashboard', error: error.message });
    }
});


// GET route for teacher dashboard
router.get('/teacher', async (req, res) => {
    const { email, password } = req.query; // Extract credentials from the query parameters

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || user.role !== 'teacher') {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Fetch the domains assigned to the teacher
        const tree = await Tree.findOne({}).populate({
            path: 'ageRanges.domains',
            match: { _id: { $in: user.domains || [] } }, // Fetch only domains assigned to the teacher
            populate: { path: 'chapters' },
        });

        if (!tree) {
            return res.status(404).json({ message: 'No domains assigned to you yet' });
        }

        res.status(200).json(tree);
    } catch (error) {
        console.error('Error fetching teacher dashboard:', error);
        res.status(500).json({ message: 'Error fetching teacher dashboard', error: error.message });
    }
});

module.exports = router;
