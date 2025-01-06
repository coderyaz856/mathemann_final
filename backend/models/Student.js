const mongoose = require('mongoose');
const User = require('./User');

const StudentSchema = new mongoose.Schema({
    gradeLevel: { type: String, required: false },
});

module.exports = User.discriminator('Student', StudentSchema);
