const Tree = require('../models/Tree');

// Get all trees
exports.getTree = async (req, res) => {
    try {
        const trees = await Tree.find().populate({
            path: 'ageRanges.domains',
            populate: { path: 'chapters' },
        });
        res.status(200).json(trees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trees', error });
    }
};

// Add a tree node
exports.addTreeNode = async (req, res) => {
    try {
        const tree = new Tree(req.body);
        await tree.save();
        res.status(201).json({ message: 'Tree node created successfully', tree });
    } catch (error) {
        res.status(500).json({ message: 'Error creating tree node', error });
    }
};

// Update a tree node
exports.updateTreeNode = async (req, res) => {
    try {
        const tree = await Tree.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tree) return res.status(404).json({ message: 'Tree node not found' });
        res.status(200).json({ message: 'Tree node updated successfully', tree });
    } catch (error) {
        res.status(500).json({ message: 'Error updating tree node', error });
    }
};

// Delete a tree node
exports.deleteTreeNode = async (req, res) => {
    try {
        const tree = await Tree.findByIdAndDelete(req.params.id);
        if (!tree) return res.status(404).json({ message: 'Tree node not found' });
        res.status(200).json({ message: 'Tree node deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting tree node', error });
    }
};

