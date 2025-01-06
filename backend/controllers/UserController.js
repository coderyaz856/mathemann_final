const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
    const { name, email, password, role, birthday } = req.body;

    if (!name || !email || !password || !role || !birthday) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role, birthday });
        
        // Debug saving process
        console.log('Attempting to save user:', newUser);

        await newUser.save(); // Save user to the database
        console.log('User saved successfully:', newUser);

        const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: "User registered successfully", token });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({ message: "Error registering user", error });
    }
};




exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User not found with email: ${email}`);
            return res.status(404).json({ message: "User not found" });
        }

        // Directly compare the plaintext password with the stored password
        if (password !== user.password) {
            console.log(`Invalid credentials for email: ${email}`);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // If the password matches, return the user's role and success message
        console.log(`Login successful for user: ${email}`);
        const role = user.role;
        res.status(200).json({ message: "Login successful", role });
    } catch (error) {
        console.error("Error during login:", error.message);
        res.status(500).json({ message: "An error occurred during login", error: error.message });
    }
};




// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error });
    }
};

// Update a user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const user = await User.findByIdAndUpdate(id, updates, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Error updating user", error });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error });
    }
};


// Fetch user role by email
exports.getUserRole = async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ role: user.role });
    } catch (error) {
        console.error("Error fetching user role:", error);
        res.status(500).json({ message: "Error fetching user role" });
    }
};
