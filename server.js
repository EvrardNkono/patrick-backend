require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// --- IMPORTATION DES ROUTES ---
const audioRoutes = require('./routes/audioRoutes');
const teachingRoutes = require('./routes/teachings');
const blogRoutes = require('./routes/blogRoutes'); 

const app = express();

// --- VÉRIFICATION DES DOSSIERS UPLOADS ---
// Indispensable pour éviter que le serveur ne plante lors du premier upload
const uploadDirs = [
    'uploads/audios', 
    'uploads/teachings', 
    'uploads/blog' // Dossier pour les images du blog
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Dossier créé : ${dir}`);
    }
});

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Rendre le dossier uploads accessible publiquement
// C'est ce qui permet d'afficher l'image dans l'e-mail et sur le site
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CONNEXION MONGODB ATLAS ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connexion réussie à MongoDB Atlas"))
  .catch(err => console.error("❌ Erreur de connexion Atlas :", err));

// --- ROUTES ---
app.use('/api/audios', audioRoutes);
app.use('/api/teachings', teachingRoutes);
app.use('/api/blog', blogRoutes); // Ici, le blogRoutes gère l'envoi de mail via Nodemailer

// Route de diagnostic
app.get('/', (req, res) => {
    res.json({ 
        status: "Serveur opérationnel", 
        message: "API PatrickResseng.com - Audios, Enseignements et Blog (Mail Ready)" 
    });
});

// --- GESTION DES ERREURS GLOBALE ---
app.use((err, req, res, next) => {
    console.error("🔥 Erreur Serveur:", err.stack);
    res.status(500).send({ message: "Une erreur interne est survenue" });
});

// --- DÉMARRAGE ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur actif sur le port ${PORT}`);
    console.log(`📧 Service Mail : info@patrickresseng.com configuré via Titan`);
});