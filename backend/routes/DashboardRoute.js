const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const Tree = require('../models/Tree');
const jwt = require('jsonwebtoken');

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


const calculateStudyHours = (studies) => {
    if (!studies || studies.length === 0) return 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter studies from current month
    const currentMonthStudies = studies.filter(study => {
        const studyDate = new Date(study.session_start);
        return studyDate.getMonth() === currentMonth && studyDate.getFullYear() === currentYear;
    });
    
    return currentMonthStudies.length;
};


const calculateActiveStreak = (studies) => {
    if (!studies || studies.length === 0) return 0;
    
    // Sort studies by date (most recent first)
    const sortedStudies = [...studies].sort((a, b) => 
        new Date(b.session_start) - new Date(a.session_start)
    );
    
    // Get unique dates (considering a day as studied if there's at least one session)
    const studyDates = new Set();
    sortedStudies.forEach(study => {
        const date = new Date(study.session_start);
        studyDates.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    });
    
    const dateArray = Array.from(studyDates).map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month, day);
    }).sort((a, b) => b - a); // Sort descending (newest first)
    
    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start with today or most recent study day
    let currentDate = dateArray[0] > today ? dateArray[0] : today;
    
    for (const date of dateArray) {
        const daysDiff = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 1) {
            // Consecutive day - increase streak
            if (daysDiff === 1) streak++;
            else if (daysDiff === 0 && streak === 0) streak = 1;
            
            currentDate = date;
        } else {
            // Break in streak
            break;
        }
    }
    
    return streak;
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ message: 'Invalid or expired token' });
            req.user = user;
            next();
        });
    } else {
        // If no token, continue to allow email/password authentication
        next();
    }
};

// GET route for student dashboard - support both token and email/password
router.get('/student', authenticateToken, async (req, res) => {
    try {
        let user;

        // Check if authenticated via token
        if (req.user) {
            console.log('User authenticated via token:', req.user.id);
            // Populate studies.chapter and quizzes
            user = await Student.findById(req.user.id)
                .populate({
                    path: 'studies.chapter',
                    populate: { path: 'quizzes' }
                })
                .populate({
                    path: 'quizAttempts.quiz'
                });
            
            if (!user) {
                user = await User.findById(req.user.id);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
            }
        } else {
            // Fall back to email/password query params
            const { email, password } = req.query; 
            
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            user = await Student.findOne({ email })
                .populate({
                    path: 'studies.chapter',
                    populate: { path: 'quizzes' }
                })
                .populate({
                    path: 'quizAttempts.quiz'
                });
            
            if (!user) {
                user = await User.findOne({ email });
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        }

        if (user.role !== 'student') {
            return res.status(403).json({ message: 'Not authorized as student' });
        }

        // Calculate the student's age
        const age = calculateAge(user.birthday);

        // Fetch tree data with fully populated chapters including quizzes
        const tree = await Tree.findOne().populate({
            path: 'ageRanges.domains',
            populate: { 
                path: 'chapters',
                populate: { path: 'quizzes' }
            }
        });

        if (!tree) {
            return res.status(404).json({ 
                message: 'No learning content available'
            });
        }

        const matchingRange = tree.ageRanges.find(range => {
            const [min, max] = range.range.split('-').map(Number);
            return age >= min && age <= max;
        });

        if (!matchingRange) {
            return res.status(404).json({ 
                message: `No content available for age ${age}`
            });
        }

        // Calculate stats for the student - now including quiz stats
        const stats = {
            totalSessions: user.studies?.length || 0,
            uniqueChapters: user.studies ? [...new Set(user.studies.map(s => s.chapter?._id?.toString()))].length : 0,
            lastStudySession: user.studies?.length > 0 ? user.studies[user.studies.length - 1].session_start : null,
            studyHoursThisMonth: calculateStudyHours(user.studies || []),
            activeStreak: calculateActiveStreak(user.studies || []),
            // Add quiz stats
            quizAttempts: user.quizAttempts?.length || 0,
            quizAvgScore: calculateQuizAverage(user.quizAttempts || [])
        };

        const response = {
            studentName: user.name,
            studentAge: age,
            range: matchingRange.range,
            domains: matchingRange.domains,
            stats,
            studies: user.studies || [],
            quizAttempts: user.quizAttempts || []
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ 
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
});

// Helper function to calculate quiz average score
const calculateQuizAverage = (quizAttempts) => {
    if (!quizAttempts || quizAttempts.length === 0) return 0;
    
    const totalScore = quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
    return Math.round(totalScore / quizAttempts.length);
};

// Add route to get teachers for a specific student - based on domains they're studying
router.get('/student/teachers', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const studentId = decoded.id;

        // Get student details
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Calculate student's age
        const age = calculateAge(student.birthday);
        
        // Find the tree data with domains for this age
        const tree = await Tree.findOne().populate({
            path: 'ageRanges.domains'
        });

        if (!tree) {
            return res.status(404).json({ message: 'No learning content available' });
        }

        // Find matching age range
        const matchingRange = tree.ageRanges.find(range => {
            const [min, max] = range.range.split('-').map(Number);
            return age >= min && age <= max;
        });

        if (!matchingRange) {
            return res.status(404).json({ message: `No content available for age ${age}` });
        }

        // Get domain IDs for the student's age range
        const domainIds = matchingRange.domains.map(d => d._id.toString());

        // Find teachers
        const teachers = await User.find({ role: 'teacher' })
            .select('-password')
            .lean();

        // Assign domains to teachers randomly (in real app would be from database)
        const teachersWithDomains = teachers.map((teacher, index) => {
            // Assign different domains to different teachers
            let assignedDomains;
            if (index === teachers.length - 1) {
                // Last teacher gets all domains (as a specialist)
                assignedDomains = [...domainIds];
            } else {
                // Other teachers get a subset of domains
                assignedDomains = domainIds.filter((_, i) => i % teachers.length === index);
            }
            
            return {
                ...teacher,
                domains: assignedDomains,
                bio: `Experienced educator specializing in ${teacher.subject || "Mathematics"}.`
            };
        });

        res.status(200).json(teachersWithDomains);
    } catch (error) {
        console.error('Error fetching student teachers:', error);
        res.status(500).json({ message: 'Error fetching teachers data', error: error.message });
    }
});

// POST route for recording study sessions (improved)
router.post('/student/study', authenticateToken, async (req, res) => {
    try {
        const { chapterId } = req.body;
        let userId;

        if (req.user && req.user.id) {
            userId = req.user.id;
        } else {
            // Fall back to email/password if no token
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ message: 'Authentication required' });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            userId = user._id;
        }

        console.log(`Recording study session for user ${userId}, chapter ${chapterId}`);

        // Find if user exists as Student
        let student = await Student.findById(userId);
        
        if (!student) {
            // Convert user to student if needed
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            if (user.role === 'student') {
                student = new Student({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    role: user.role,
                    birthday: user.birthday,
                    studies: []
                });
                await student.save();
                console.log('Converted user to student:', student);
            } else {
                return res.status(403).json({ message: 'Only students can record study sessions' });
            }
        }

        // Current timestamp for the study session
        const sessionTimestamp = new Date();
        
        // Record the study session
        student.studies.push({
            chapter: chapterId,
            session_start: sessionTimestamp
        });

        await student.save();
        console.log("Study session saved successfully");

        // Calculate updated stats
        const stats = {
            totalSessions: student.studies.length,
            uniqueChapters: [...new Set(student.studies.map(s => s.chapter.toString()))].length,
            lastStudySession: sessionTimestamp,
            studyHoursThisMonth: calculateStudyHours(student.studies),
            activeStreak: calculateActiveStreak(student.studies)
        };

        res.status(200).json({ 
            message: 'Study session recorded successfully',
            session: {
                chapter: chapterId,
                session_start: sessionTimestamp
            },
            stats: stats
        });
    } catch (error) {
        console.error('Error recording study session:', error);
        res.status(500).json({ 
            message: 'Error recording study session',
            error: error.message
        });
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
