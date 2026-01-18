const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Audio = require('../models/Audio');

// 1. Configuration du stockage physique
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/audios/');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// 2. Route POST : Ajouter un audio
router.post('/', upload.single('audioFile'), async (req, res) => {
    console.log("📩 Requête POST reçue sur /api/audios");
    console.log("Corps de la requête :", req.body);
    console.log("Fichier reçu :", req.file ? req.file.filename : "AUCUN FICHIER");

    try {
        if (!req.file) {
            return res.status(400).json({ message: "Veuillez joindre un fichier audio." });
        }

        const newAudio = new Audio({
            title: req.body.title,
            description: req.body.description,
            category: Number(req.body.category),
            audioUrl: `/uploads/audios/${req.file.filename}`,
            filename: req.file.filename
        });

        const savedAudio = await newAudio.save();
        console.log("✅ Audio enregistré en base de données :", savedAudio._id);
        res.status(201).json(savedAudio);
    } catch (err) {
        console.error("❌ Erreur POST :", err.message);
        res.status(500).json({ message: "Erreur lors de l'upload", error: err.message });
    }
});

// 3. Route GET : Lister tous les audios
router.get('/', async (req, res) => {
    try {
        const audios = await Audio.find().sort({ createdAt: -1 });
        res.json(audios);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. Route PUT : Modifier un audio
router.put('/:id', upload.single('audioFile'), async (req, res) => {
    console.log(`🔄 Requête PUT pour l'ID : ${req.params.id}`);
    try {
        const updateData = {
            title: req.body.title,
            description: req.body.description,
            category: Number(req.body.category)
        };

        if (req.file) {
            const oldAudio = await Audio.findById(req.params.id);
            if (oldAudio && oldAudio.filename) {
                const oldPath = path.join(__dirname, '../uploads/audios/', oldAudio.filename);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.audioUrl = `/uploads/audios/${req.file.filename}`;
            updateData.filename = req.file.filename;
        }

        const updatedAudio = await Audio.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedAudio);
    } catch (err) {
        console.error("❌ Erreur PUT :", err.message);
        res.status(500).json({ message: "Erreur modification", error: err.message });
    }
});

// 5. Route DELETE : Supprimer
router.delete('/:id', async (req, res) => {
    console.log(`🗑️ Requête DELETE pour l'ID : ${req.params.id}`);
    try {
        const audio = await Audio.findById(req.params.id);
        if (!audio) return res.status(404).json({ message: "Audio non trouvé" });

        const filePath = path.join(__dirname, '../uploads/audios/', audio.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Audio.findByIdAndDelete(req.params.id);
        res.json({ message: "Supprimé avec succès" });
    } catch (err) {
        res.status(500).json({ message: "Erreur suppression", error: err.message });
    }
});

module.exports = router;