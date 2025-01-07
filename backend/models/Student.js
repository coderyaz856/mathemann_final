const mongoose = require('mongoose');
const User = require('./User');

const StudentSchema = new mongoose.Schema({
    studies: [ // New field added
        {
            chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
            session_start: { type: Date, required: true },
        },
    ],
});

module.exports = User.discriminator('Student', StudentSchema);
