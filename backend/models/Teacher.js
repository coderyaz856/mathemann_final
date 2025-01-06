const mongoose = require('mongoose');
const User = require('./User');

const TeacherSchema = new mongoose.Schema({
    subject: { type: String, required: false },
});

module.exports = User.discriminator('Teacher', TeacherSchema);
