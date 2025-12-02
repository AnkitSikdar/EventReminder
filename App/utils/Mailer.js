require("dotenv").config();
const nodemailer = require("nodemailer");

class Mailer {
  constructor() {
    const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
    const secure = port === 465; // SSL for 465, STARTTLS for 587

    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: port,
      secure: secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },

    });

    // Verify SMTP connection on startup
    this.transporter.verify((err, success) => {
      if (err) console.error("❌ SMTP connection failed:", err);
      else console.log(`✅ SMTP server ready on port ${port} (secure=${secure})`);
    });
  }

  // Send email (text or optional HTML)
  async sendEmail(to, subject, text, html = null) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html
      });
      console.log("✅ Email sent:", info.messageId);
    } catch (err) {
      console.error("❌ Mailer Error:", err);
    }
  }
}

module.exports = new Mailer();
