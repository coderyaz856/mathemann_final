const express = require('express');
const {
    getTree,
    addTreeNode,
    updateTreeNode,
    deleteTreeNode,
} = require('../controllers/TreeController'); // Ensure the path and function names are correct
const router = express.Router();

// Routes
router.get('/', getTree);
router.post('/', addTreeNode);
router.put('/:id', updateTreeNode);
router.delete('/:id', deleteTreeNode);

module.exports = router;
