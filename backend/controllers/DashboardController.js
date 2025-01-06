const Tree = require('../models/Tree');
const User = require('../models/User');
const bcrypt = require('bcryptjs');


// Get student dashboard
exports.getStudentDashboard = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email, role: 'student' });
        if (!user) {
            return res.status(404).json({ message: "Student not found or not authorized" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Fetch the tree data based on the student's profile (age or preferences)
        const tree = await Tree.findOne().populate({
            path: 'ageRanges.domains',
            populate: { path: 'chapters' },
        });

        res.status(200).json(tree);
    } catch (error) {
        res.status(500).json({ message: "Error fetching student dashboard", error: error.message });
    }
};


// Get Teacher Dashboard: Fetch all chapters for management
exports.getTeacherDashboard = async (req, res) => {
    const userId = req.user.id; // Extract user ID from token

    try {
        // Fetch all data or customize logic for teachers
        const data = await Tree.find();

        res.status(200).json({
            message: "Teacher dashboard data fetched successfully",
            data,
        });
    } catch (error) {
        console.error("Error fetching teacher dashboard data:", error);
        res.status(500).json({ message: "Error fetching teacher dashboard data", error });
    }
};
