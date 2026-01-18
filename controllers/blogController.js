const nodemailer = require('nodemailer');
const Blog = require('../models/Blog'); // Ton modèle Mongoose

// 1. Configuration SMTP Hostinger
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // Port 465 utilise SSL
  auth: {
    user: 'ton-email@ton-domaine.com', // Crée cette adresse sur Hostinger
    pass: 'ton-mot-de-passe-email'
  }
});

exports.createPost = async (req, res) => {
  try {
    const { title, excerpt, content, category, language, sendEmail, emailTargetType, customEmails } = req.body;
    const image = req.file ? req.file.filename : null;

    // 2. Enregistrement de l'article en base de données
    const newPost = new Blog({
      title, excerpt, content, category, language, image
    });
    await newPost.save();

    // 3. Logique d'envoi d'e-mail
    if (sendEmail === "true") {
      let recipients = [];

      if (emailTargetType === "all") {
        // Optionnel: Récupérer tous tes abonnés depuis une autre collection
        // const subscribers = await Subscriber.find();
        // recipients = subscribers.map(s => s.email);
        console.log("Envoi à tous les abonnés (logique à connecter à ta DB)");
      } else if (emailTargetType === "custom" && customEmails) {
        recipients = customEmails.split(',').map(email => email.trim());
      }

      if (recipients.length > 0) {
        const mailOptions = {
          from: '"Patrick Resseng" <ton-email@ton-domaine.com>',
          to: recipients.join(','),
          subject: `✨ Nouvel Article : ${title}`,
          html: `
            <div style="background-color: #fff8e7; padding: 40px; font-family: 'Playfair Display', serif; color: #331f01; border: 1px solid #ce9a10;">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="text-transform: uppercase; letter-spacing: 4px; color: #ce9a10; font-size: 12px;">Patrick Resseng | Blog</span>
                <h1 style="font-size: 32px; margin-top: 10px;">${title}</h1>
                <div style="width: 40px; height: 1px; background: #ce9a10; margin: 20px auto;"></div>
              </div>
              
              <img src="https://ton-domaine.com/uploads/blog/${image}" style="width: 100%; max-height: 400px; object-fit: cover; border: 8px solid white; box-shadow: 0 10px 20px rgba(0,0,0,0.1);" />
              
              <p style="font-style: italic; font-size: 18px; line-height: 1.8; margin-top: 30px;">
                ${excerpt}
              </p>
              
              <div style="margin-top: 40px; text-align: center;">
                <a href="https://ton-domaine.com/blog" style="background-color: #331f01; color: #ce9a10; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">
                  Lire l'article complet
                </a>
              </div>
              
              <footer style="margin-top: 50px; text-align: center; font-size: 10px; opacity: 0.6; text-transform: uppercase;">
                © 2026 Patrick Resseng. Tous droits réservés.
              </footer>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
      }
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};