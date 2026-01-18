const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const BlogPost = require('../models/BlogPost');

// --- CONFIGURATION NODEMAILER ---
const transporter = nodemailer.createTransport({
  host: 'smtp.titan.email',
  port: 465,
  secure: true, 
  auth: {
    user: 'info@patrickresseng.com',
    pass: 'Chesstitan1#' 
  }
});

// Configuration stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/blog/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- ROUTES ---

router.get('/', async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  const { title, excerpt, content, category, language, sendEmail, emailTargetType, customEmails } = req.body;
  
  const post = new BlogPost({
    title, excerpt, content, category, language,
    image: req.file ? req.file.filename : null
  });

  try {
    const newPost = await post.save();
    console.log("✅ Article sauvegardé en base de données");

    // Vérification stricte de la condition d'envoi
    if (String(sendEmail) === "true") {
      let recipients = [];
      if (emailTargetType === "custom" && customEmails) {
        recipients = customEmails.split(',').map(e => e.trim());
      }

      if (recipients.length > 0) {
        console.log(`📧 Tentative d'envoi à ${recipients.length} destinataires...`);
        
        try {
          await transporter.sendMail({
            from: '"Patrick Resseng" <info@patrickresseng.com>',
            to: recipients.join(','),
            subject: title,
            headers: {
              'List-Unsubscribe': '<mailto:info@patrickresseng.com?subject=unsubscribe>',
              'Precedence': 'bulk'
            },
            html: `
              <div style="background-color: #fffaf0; padding: 40px; font-family: 'Times New Roman', serif; color: #1a1a1a; border: 1px solid #ce9a10; max-width: 600px; margin: auto;">
                <h1 style="text-align: center;">${title}</h1>
                ${req.file ? `
                  <div style="text-align: center;">
                    <img src="https://patrick-backend.onrender.com/uploads/blog/${req.file.filename}" style="width: 100%; max-width: 500px;" />
                  </div>` : ''}
                <p style="font-size: 18px; line-height: 1.8; text-align: center;">"${excerpt}"</p>
                <div style="text-align: center; margin-top: 35px;">
                  <a href="https://patrickresseng.com/blog" style="background-color: #1a1a1a; color: #ce9a10; padding: 18px 40px; text-decoration: none; font-weight: bold;">LIRE L'ARTICLE COMPLET</a>
                </div>
              </div>
            `
          });
          console.log("🚀 E-mails envoyés avec succès !");
        } catch (mailErr) {
          console.error("❌ Erreur spécifique Nodemailer :", mailErr);
          // On ne bloque pas la réponse 201 même si le mail échoue
        }
      }
    }

    res.status(201).json(newPost);
  } catch (err) {
    console.error("❌ Erreur globale route POST :", err);
    res.status(400).json({ message: err.message });
  }
});

// Modifier
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = req.file.filename;
    const updatedPost = await BlogPost.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Supprimer
router.delete('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (post && post.image) {
      const imagePath = path.join(__dirname, '../uploads/blog/', post.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ message: "Article supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;