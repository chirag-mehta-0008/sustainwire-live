const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true },
    typeColor: { type: String, default: 'green' },
    description: { type: String, required: true },
    applyLink: { type: String, required: true },
    updatedBy: { type: String, default: 'Admin' },
    analytics: {
        views: { type: Number, default: 0 },
        unique: { type: Number, default: 0 },
        topCountry: { type: String, default: 'N/A' }
    }
});

module.exports = mongoose.model('Job', JobSchema);