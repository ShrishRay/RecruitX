const twilio = require('twilio');

/**
 * Send real-time SMS OTP via 2Factor.in, Fast2SMS, or Twilio
 */
async function sendSmsOtp(toPhoneNumber, otpCode) {
  try {
    // Extract 10-digit mobile number
    const cleanNumber = toPhoneNumber.replace(/[^0-9]/g, '').slice(-10);

    // ── 1. 2Factor.in Real-Time Delivery (Primary Free Gateway) ───────────
    if (process.env.TWOFACTOR_API_KEY) {
      const response = await fetch(`https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${cleanNumber}/${otpCode}/AUTOGEN`);
      const data = await response.json();
      if (data.Status === 'Success') {
        console.log(`📱 [2FACTOR SMS SENT] Real-Time SMS dispatched to: ${cleanNumber} | SessionId: ${data.Details}`);
        return true;
      } else {
        console.error(`❌ [2FACTOR SMS ERROR]:`, data.Details || data);
      }
    }

    // ── 2. Fast2SMS Real-Time Delivery ──────────────────────────────────
    if (process.env.FAST2SMS_API_KEY) {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: `Your RecruitX Verification Code is: ${otpCode}. Valid for 10 minutes.`,
          language: 'english',
          flash: 0,
          numbers: cleanNumber,
        }),
      });

      const data = await response.json();
      if (data.return) {
        console.log(`📱 [FAST2SMS SENT] Real-Time SMS dispatched to: ${cleanNumber}`);
        return true;
      } else {
        console.error(`❌ [FAST2SMS ERROR]:`, data.message || data);
      }
    }

    // ── 3. Twilio SMS Delivery ─────────────────────────────────────────
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && fromPhone) {
      const client = twilio(accountSid, authToken);
      const message = await client.messages.create({
        body: `Your RecruitX Verification Code is: ${otpCode}. Valid for 10 minutes.`,
        from: fromPhone,
        to: toPhoneNumber,
      });

      console.log(`📱 [TWILIO SMS SENT] To: ${toPhoneNumber} | SID: ${message.sid}`);
      return true;
    }

    // ── 4. Terminal Log Fallback ───────────────────────────────────────
    console.log(`\n📱 [SMS DISPATCH SIMULATOR] To Number: ${cleanNumber}`);
    console.log(`   SMS Code: "${otpCode}"`);
    return true;
  } catch (error) {
    console.error('❌ [SMS SEND ERROR]:', error.message);
    return false;
  }
}

module.exports = { sendSmsOtp };
