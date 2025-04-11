const express = require('express');
const router = express.Router();
const Chapter = require('../models/Chapter');
const { authenticateToken } = require('../middleware/auth'); // Import the shared middleware

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
