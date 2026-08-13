const nodemailer = require('nodemailer');

/**
 * Send real-time Email OTP via Nodemailer
 */
async function sendEmailOtp(toEmail, otpCode) {
  try {
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Use configured production/development SMTP server (e.g. Gmail App Password, SendGrid, Mailtrap)
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Fallback to Ethereal test SMTP if no credentials configured
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"RecruitX Verification" <no-reply@recruitx.ai>',
      to: toEmail,
      subject: '🔐 Your RecruitX Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">Recruit<span style="color: #0f172a;">X</span></h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Intelligent Hiring & Resume Routing Platform</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <p style="color: #334155; font-size: 14px; margin-top: 0;">Use the verification code below to verify your email address:</p>
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #4f46e5; margin: 15px 0;">${otpCode}</div>
            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">This code is valid for 10 minutes. Do not share it with anyone.</p>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">If you did not request this verification code, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [EMAIL SENT] To: ${toEmail} | MessageID: ${info.messageId}`);
    
    // Log preview link if using Ethereal test account
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`🔗 [EMAIL PREVIEW URL]: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    console.error('❌ [EMAIL SEND ERROR]:', error.message);
    return false;
  }
}

module.exports = { sendEmailOtp };
