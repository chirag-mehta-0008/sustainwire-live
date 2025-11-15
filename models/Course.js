const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    provider: { type: String, required: true },
    format: { type: String, required: true },
    description: { type: String, required: true },
    applyLink: { type: String, required: true },
    updatedBy: { type: String, default: 'Admin' },
    analytics: {
        views: { type: Number, default: 0 },
        unique: { type: Number, default: 0 },
        topCountry: { type: String, default: 'N/A' }
    }
});

module.exports = mongoose.model('Course', CourseSchema);