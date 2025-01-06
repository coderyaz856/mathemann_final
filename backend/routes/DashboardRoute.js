const express = require('express');
const { getStudentDashboard, getTeacherDashboard } = require('../controllers/DashboardController');

const router = express.Router();

router.get('/student',getStudentDashboard);
router.get('/teacher', getTeacherDashboard);

module.exports = router;
