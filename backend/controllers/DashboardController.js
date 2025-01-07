const Tree = require('../models/Tree');
const User = require('../models/User');

// Get student dashboard
exports.getStudentDashboard = async (req, res) => {
    const { email, password } = req.query;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // Find the student user by email
        const user = await User.findOne({ email, role: 'student' });
        if (!user) {
            return res.status(404).json({ message: "Student not found or not authorized" });
        }

        // Compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Calculate age based on the birthday
        const currentYear = new Date().getFullYear();
        const birthYear = new Date(user.birthday).getFullYear();
        const age = currentYear - birthYear;

        // Fetch tree data filtered by age ranges
        const tree = await Tree.findOne({
            'ageRanges.range': { $regex: new RegExp(`^${age}-`) } // Match age range starting with the student's age
        }).populate({
            path: 'ageRanges.domains',
            populate: { path: 'chapters' },
        });

        if (!tree) {
            return res.status(404).json({ message: "No matching tree data found for the student" });
        }

        res.status(200).json(tree);
    } catch (error) {
        console.error('Error fetching tree:', error);
        res.status(500).json({ message: 'Error fetching student dashboard', error: error.message });
    }
};


// Get teacher dashboard
exports.getTeacherDashboard = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email, role: 'teacher' });
        if (!user) {
            return res.status(404).json({ message: "Teacher not found or unauthorized" });
        }

        // Compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Fetch all tree data for the teacher
        const trees = await Tree.find().populate({
            path: 'ageRanges.domains',
            populate: { path: 'chapters' },
        });

        if (!trees || trees.length === 0) {
            return res.status(404).json({ message: "No tree data available" });
        }

        res.status(200).json(trees);
    } catch (error) {
        console.error("Error fetching teacher dashboard:", error.message);
        res.status(500).json({ message: "Error fetching teacher dashboard", error: error.message });
    }
};

