const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true }, // Résumé pour la liste
  content: { type: String, required: true }, // Corps de l'article
  image: { type: String }, // Nom du fichier image
  category: { type: String, default: 'spirituality' },
  language: { type: String, enum: ['fr', 'en'], required: true },
  date: { type: Date, default: Date.now },
});

const BlogPost = mongoose.model('BlogPost', BlogPostSchema);
module.exports = BlogPost; // Export direct, sans rien d'autre