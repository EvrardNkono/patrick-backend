const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: Number, required: true }, // 1 pour Foi, 2 pour Musique
    audioUrl: { type: String, required: true },
    filename: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Audio', audioSchema);