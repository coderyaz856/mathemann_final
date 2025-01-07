const express = require('express');
const {
    register,
    login,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserRole,
} = require('../controllers/UserController');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
// Route to fetch user role by email
router.get('/role/:email', getUserRole);

module.exports = router;
