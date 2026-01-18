const mongoose = require('mongoose');

const TeachingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  language: { type: String, default: 'fr' },
  icon: { type: String }, // Stockera le nom du fichier image si tu en ajoutes une
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Teaching', TeachingSchema);