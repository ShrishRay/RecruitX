const nodemailer = require('nodemailer');

/**
 * Helper to get active Nodemailer transporter
 */
async function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

/**
 * Send real-time Email OTP via Nodemailer
 */
async function sendEmailOtp(toEmail, otpCode) {
  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"RecruitX Verification" <no-reply@recruitx.ai>',
      to: toEmail,
      subject: '🔐 Your RecruitX Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
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
    
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`🔗 [EMAIL PREVIEW URL]: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    console.error('❌ [EMAIL SEND ERROR]:', error.message);
    return false;
  }
}

/**
 * Send Interview Invitation with Google Meet link & Calendar Attachment
 */
async function sendInterviewInvitationEmail({
  toEmail,
  recipientName,
  isRecruiter = false,
  jobTitle,
  companyName,
  startTime,
  endTime,
  durationMinutes,
  timeZone,
  meetLink,
  googleCalendarLink,
  description,
  icsData,
  otherPartyName,
  otherPartyEmail
}) {
  try {
    const transporter = await getTransporter();
    const formattedDate = new Date(startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedStartTime = new Date(startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const subject = isRecruiter
      ? `📅 Interview Confirmed: ${recipientName} & ${otherPartyName} for ${jobTitle}`
      : `🎉 Interview Scheduled: ${jobTitle} at ${companyName || 'RecruitX'}`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Recruit<span style="color: #0f172a;">X</span></h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 500;">Intelligent Interview & Shortlisting Engine</p>
        </div>

        <!-- Hero Card -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 24px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 24px;">
          <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            ${isRecruiter ? 'Recruiter Schedule Confirmation' : 'Shortlisted Candidate Interview'}
          </span>
          <h2 style="margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">${jobTitle}</h2>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">${companyName ? `with ${companyName}` : ''}</p>
        </div>

        <!-- Appointment Details -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">🗓️ Appointment Details</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 35%;">Date:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Time:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${formattedStartTime} (${durationMinutes || 45} mins)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">${isRecruiter ? 'Candidate:' : 'Recruiter:'}</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${otherPartyName} (${otherPartyEmail})</td>
            </tr>
            ${description ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; vertical-align: top;">Agenda / Notes:</td>
              <td style="padding: 6px 0; color: #334155; font-size: 13px;">${description}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- CTAs: Google Meet & Calendar -->
        <div style="text-align: center; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px;">
          <!-- Join Google Meet -->
          <div style="margin-bottom: 12px;">
            <a href="${meetLink}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.3);">
              🎥 Join Google Meet Call
            </a>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;">
              Direct Link: <a href="${meetLink}" style="color: #4f46e5; word-break: break-all;">${meetLink}</a>
            </p>
          </div>

          <!-- Add to Google Calendar -->
          <div>
            <a href="${googleCalendarLink}" target="_blank" style="display: inline-block; background-color: #ffffff; color: #1e293b; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; border: 1px solid #cbd5e1;">
              📅 Add to Google Calendar
            </a>
          </div>
        </div>

        <!-- Footer Notice -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0;">An iCalendar (.ics) invite is attached. You can import this into Apple Calendar, Microsoft Outlook, or Google Calendar.</p>
          <p style="margin: 0;">Powered by RecruitX Intelligent Shortlisting & Calendar Engine</p>
        </div>
      </div>
    `;

    const attachments = [];
    if (icsData) {
      attachments.push({
        filename: 'interview-invite.ics',
        content: icsData,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"RecruitX Interviews" <interviews@recruitx.ai>',
      to: toEmail,
      subject,
      html: htmlContent,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [INTERVIEW EMAIL SENT] To: ${toEmail} | MessageID: ${info.messageId}`);
    
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`🔗 [EMAIL PREVIEW URL]: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ [INTERVIEW EMAIL ERROR to ${toEmail}]:`, error.message);
    return false;
  }
}

/**
 * Send cancellation notice
 */
async function sendInterviewCancellationEmail({
  toEmail,
  recipientName,
  jobTitle,
  startTime,
  cancelledByName,
  reason
}) {
  try {
    const transporter = await getTransporter();
    const formattedDate = new Date(startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"RecruitX Interviews" <interviews@recruitx.ai>',
      to: toEmail,
      subject: `❌ Interview Cancelled: ${jobTitle} (${formattedDate})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #e11d48; margin: 0; font-size: 22px; font-weight: 800;">Interview Cancelled</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">RecruitX Platform Notification</p>
          </div>
          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 14px; color: #9f1239;">
              Hi <strong>${recipientName}</strong>, the interview for <strong>${jobTitle}</strong> originally scheduled for <strong>${formattedDate}</strong> has been cancelled by ${cancelledByName}.
            </p>
            ${reason ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #be123c;">Reason: ${reason}</p>` : ''}
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Please visit your RecruitX Dashboard for updates or to contact the recruiter.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('❌ [CANCEL EMAIL ERROR]:', error.message);
    return false;
  }
}

module.exports = {
  sendEmailOtp,
  sendInterviewInvitationEmail,
  sendInterviewCancellationEmail
};

