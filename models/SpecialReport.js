const mongoose = require('mongoose');

const SpecialReportSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, required: true },
    applyLink: { type: String, default: '#' },
    updatedBy: { type: String, default: 'Admin' },
    analytics: {
        views: { type: Number, default: 0 },
        unique: { type: Number, default: 0 },
        topCountry: { type: String, default: 'N/A' }
    }
});

module.exports = mongoose.model('SpecialReport', SpecialReportSchema);