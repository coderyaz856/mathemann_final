const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    content: { type: String },
    quizzes: [String],
    images: [String],
});

module.exports = mongoose.model('Chapter', chapterSchema);
