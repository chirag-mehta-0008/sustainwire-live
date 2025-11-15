const mongoose = require('mongoose');

// Yeh News data ka structure (schema) hai
const NewsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
    updatedBy: { type: String, default: 'Admin' },
    analytics: {
        views: { type: Number, default: 0 },
        unique: { type: Number, default: 0 },
        topCountry: { type: String, default: 'N/A' }
    }
});

module.exports = mongoose.model('News', NewsSchema);