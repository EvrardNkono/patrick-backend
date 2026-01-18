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

    if (sendEmail === "true") {
      let recipients = [];
      if (emailTargetType === "custom" && customEmails) {
        recipients = customEmails.split(',').map(e => e.trim());
      }

      if (recipients.length > 0) {
        // --- OPTIMISATION ANTI-SPAM ---
        await transporter.sendMail({
          from: '"Patrick Resseng" <info@patrickresseng.com>',
          to: recipients.join(','),
          subject: title, // Pas d'émoji au début pour le test
          headers: {
            'List-Unsubscribe': '<mailto:info@patrickresseng.com?subject=unsubscribe>',
            'Precedence': 'bulk'
          },
          html: `
            <div style="background-color: #fffaf0; padding: 40px; font-family: 'Times New Roman', serif; color: #1a1a1a; border: 1px solid #ce9a10; max-width: 600px; margin: auto;">
              <div style="text-align: center; border-bottom: 1px solid rgba(206, 154, 16, 0.3); padding-bottom: 20px; margin-bottom: 25px;">
                <span style="color: #ce9a10; text-transform: uppercase; letter-spacing: 3px; font-size: 14px; font-weight: bold;">Patrick Resseng</span>
              </div>
              
              <h1 style="font-size: 26px; text-align: center; margin-bottom: 20px; color: #1a1a1a;">${title}</h1>
              
              ${req.file ? `
                <div style="text-align: center;">
                  <img src="https://patrickresseng.com/uploads/blog/${req.file.filename}" alt="${title}" style="width: 100%; max-width: 500px; border: 1px solid #ce9a10; padding: 5px; background: #fff;" />
                </div>` : ''}
              
              <p style="font-size: 18px; line-height: 1.8; color: #333; margin-top: 25px; font-style: italic; text-align: center; padding: 0 20px;">
                "${excerpt}"
              </p>
              
              <div style="text-align: center; margin-top: 35px;">
                <a href="https://patrickresseng.com/blog" style="background-color: #1a1a1a; color: #ce9a10; padding: 18px 40px; text-decoration: none; font-weight: bold; letter-spacing: 2px; border: 1px solid #ce9a10; display: inline-block; font-size: 13px;">
                  LIRE L'ARTICLE COMPLET
                </a>
              </div>
              
              <p style="text-align: center; font-size: 10px; color: #999; margin-top: 40px; letter-spacing: 1px;">
                Vous recevez cet e-mail car vous êtes inscrit sur patrickresseng.com.<br>
                <a href="mailto:info@patrickresseng.com?subject=Unsubscribe" style="color: #ce9a10;">Se désabonner</a>
              </p>
            </div>
          `
        });
      }
    }
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Détail erreur mail:", err);
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