const express = require('express');
const router = express.Router();
const Teaching = require('../models/teaching'); // Petit commentaire pour forcer Git
const multer = require('multer');
const path = require('path');

// Configuration avancée de Multer pour conserver l'extension du fichier
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/teachings/');
  },
  filename: (req, file, cb) => {
    // Génère un nom unique : timestamp-nom-original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// @route   POST /api/teachings (Créer)
router.post('/', upload.single('teachingIcon'), async (req, res) => {
  try {
    const { title, content, language } = req.body;
    const newTeaching = new Teaching({
      title,
      content,
      language,
      icon: req.file ? req.file.filename : null
    });
    const savedTeaching = await newTeaching.save();
    res.status(201).json(savedTeaching);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/teachings (Lire tout)
router.get('/', async (req, res) => {
  try {
    const teachings = await Teaching.find().sort({ createdAt: -1 });
    res.json(teachings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- NOUVELLE ROUTE : MODIFIER (PUT) ---
// @route   PUT /api/teachings/:id
router.put('/:id', upload.single('teachingIcon'), async (req, res) => {
  try {
    const { title, content, language } = req.body;
    
    // Préparation des données de mise à jour
    const updateData = { title, content, language };

    // Si une nouvelle image est envoyée, on met à jour le nom du fichier
    if (req.file) {
      updateData.icon = req.file.filename;
    }

    const updatedTeaching = await Teaching.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true } // Renvoie l'objet mis à jour
    );

    if (!updatedTeaching) {
      return res.status(404).json({ message: "Enseignement non trouvé" });
    }

    res.json(updatedTeaching);
  } catch (err) {
    console.error("Erreur PUT teachings:", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
});

// @route   DELETE /api/teachings/:id (Supprimer)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Teaching.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Introuvable" });
    res.json({ message: "Enseignement supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;