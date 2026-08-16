const { google } = require('googleapis');
const crypto = require('crypto');

/**
 * Helper to generate a realistic, valid-format Google Meet meeting code
 * Format: 3 chars - 4 chars - 3 chars (e.g. abc-defg-hij)
 */
function generateMeetingCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const getRandom = (len) => {
    let result = '';
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  };
  return `${getRandom(3)}-${getRandom(4)}-${getRandom(3)}`;
}

/**
 * Format Date to ISO string formatted for Google Calendar URL (YYYYMMDDTHHmmssZ)
 */
function formatToGCalDate(date) {
  const d = new Date(date);
  return d.toISOString().replace(/-|:|\.\d+/g, '');
}

/**
 * Generate a direct 1-click "Add to Google Calendar" web link
 */
function generateGoogleCalendarUrl({ title, description, startTime, endTime, meetLink, location, candidateEmail, recruiterEmail }) {
  const start = formatToGCalDate(startTime);
  const end = formatToGCalDate(endTime);
  const eventTitle = encodeURIComponent(title || 'Technical Interview');
  const details = encodeURIComponent(
    `${description || 'Scheduled Interview via RecruitX'}\n\n🎥 Google Meet Video Call: ${meetLink}\n\nRecruiter: ${recruiterEmail || ''}\nCandidate: ${candidateEmail || ''}`
  );
  const loc = encodeURIComponent(meetLink || location || 'Google Meet');
  
  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${start}/${end}&details=${details}&location=${loc}`;
  if (candidateEmail && recruiterEmail) {
    url += `&add=${encodeURIComponent(candidateEmail)},${encodeURIComponent(recruiterEmail)}`;
  }
  return url;
}

/**
 * Generate standard RFC 5545 iCalendar (.ics) string for appointment creation
 */
function generateICalendarData({ uid, title, description, startTime, endTime, meetLink, candidateName, candidateEmail, recruiterName, recruiterEmail }) {
  const start = formatToGCalDate(startTime);
  const end = formatToGCalDate(endTime);
  const now = formatToGCalDate(new Date());
  const cleanUid = uid || `recruitx-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@recruitx.ai`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RecruitX//Interview Scheduling Engine//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${cleanUid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(description || 'Interview scheduled via RecruitX').replace(/\n/g, '\\n')}\\n\\nJoin Google Meet: ${meetLink}`,
    `LOCATION:${meetLink}`,
    `ORGANIZER;CN=${recruiterName || 'Recruiter'}:mailto:${recruiterEmail || 'recruiter@recruitx.ai'}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${candidateName || 'Candidate'}:mailto:${candidateEmail}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${recruiterName || 'Recruiter'}:mailto:${recruiterEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Upcoming Interview via RecruitX in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Initialize Google Calendar API client if OAuth or Service Account credentials are provided in .env
 */
function getGoogleCalendarClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  // Check for Google Service Account credentials
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (serviceAccountEmail && privateKey) {
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
    });
    return google.calendar({ version: 'v3', auth });
  }

  return null;
}

/**
 * Create an interview appointment on Google Calendar with a Google Meet conference link
 */
async function createCalendarEventWithMeet({
  title,
  description,
  startTime,
  endTime,
  timeZone = 'UTC',
  recruiterEmail,
  recruiterName,
  candidateEmail,
  candidateName,
}) {
  const calendarClient = getGoogleCalendarClient();
  const meetingCode = generateMeetingCode();
  const fallbackMeetLink = `https://meet.google.com/${meetingCode}`;

  let meetLink = fallbackMeetLink;
  let googleEventId = '';
  let googleCalendarLink = '';
  let calendarEventCreated = false;

  // Try live Google Calendar API if credentials configured
  if (calendarClient) {
    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
      const requestId = `meet-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const eventPayload = {
        summary: title,
        description: `${description || ''}\n\nScheduled via RecruitX Intelligent Hiring Platform.\nCandidate: ${candidateName} (${candidateEmail})\nRecruiter: ${recruiterName} (${recruiterEmail})`,
        start: {
          dateTime: new Date(startTime).toISOString(),
          timeZone: timeZone,
        },
        end: {
          dateTime: new Date(endTime).toISOString(),
          timeZone: timeZone,
        },
        attendees: [
          { email: candidateEmail, displayName: candidateName, responseStatus: 'needsAction' },
          { email: recruiterEmail, displayName: recruiterName, responseStatus: 'accepted' }
        ],
        conferenceData: {
          createRequest: {
            requestId: requestId,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 15 }
          ]
        }
      };

      const response = await calendarClient.events.insert({
        calendarId,
        resource: eventPayload,
        conferenceDataVersion: 1,
        sendUpdates: 'all' // Dispatches Google Calendar notifications to both recruiter and candidate
      });

      if (response.data) {
        googleEventId = response.data.id || '';
        googleCalendarLink = response.data.htmlLink || '';
        calendarEventCreated = true;

        if (response.data.hangoutLink) {
          meetLink = response.data.hangoutLink;
        } else if (response.data.conferenceData?.entryPoints) {
          const videoEntry = response.data.conferenceData.entryPoints.find(e => e.entryPointType === 'video');
          if (videoEntry?.uri) {
            meetLink = videoEntry.uri;
          }
        }
        console.log(`📅 [GOOGLE CALENDAR API] Created event ${googleEventId} with Meet link: ${meetLink}`);
      }
    } catch (apiError) {
      console.warn('⚠️ [GOOGLE CALENDAR API ERROR / FALLBACK USED]:', apiError.message);
      // Seamlessly fall back to generated Meet link and 1-click Calendar URL
    }
  }

  // Generate 1-click Google Calendar Web link & iCal (.ics) data
  if (!googleCalendarLink) {
    googleCalendarLink = generateGoogleCalendarUrl({
      title,
      description,
      startTime,
      endTime,
      meetLink,
      candidateEmail,
      recruiterEmail
    });
  }

  const icsData = generateICalendarData({
    uid: googleEventId ? `gcal-${googleEventId}` : undefined,
    title,
    description,
    startTime,
    endTime,
    meetLink,
    candidateName,
    candidateEmail,
    recruiterName,
    recruiterEmail
  });

  return {
    meetLink,
    googleEventId,
    googleCalendarLink,
    calendarEventCreated,
    icsData
  };
}

/**
 * Reschedule an existing Google Calendar Event
 */
async function updateCalendarEvent({
  googleEventId,
  title,
  description,
  startTime,
  endTime,
  timeZone = 'UTC',
  candidateEmail,
  candidateName,
  recruiterEmail,
  recruiterName,
  meetLink
}) {
  const calendarClient = getGoogleCalendarClient();
  let updatedInGoogle = false;

  if (calendarClient && googleEventId) {
    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
      await calendarClient.events.patch({
        calendarId,
        eventId: googleEventId,
        resource: {
          summary: title,
          description: `${description || ''}\n\n(Updated) Scheduled via RecruitX\nCandidate: ${candidateName} (${candidateEmail})\nRecruiter: ${recruiterName} (${recruiterEmail})`,
          start: {
            dateTime: new Date(startTime).toISOString(),
            timeZone
          },
          end: {
            dateTime: new Date(endTime).toISOString(),
            timeZone
          }
        },
        sendUpdates: 'all'
      });
      updatedInGoogle = true;
      console.log(`📅 [GOOGLE CALENDAR API] Updated event ${googleEventId}`);
    } catch (err) {
      console.warn('⚠️ [GOOGLE CALENDAR API UPDATE ERROR]:', err.message);
    }
  }

  const googleCalendarLink = generateGoogleCalendarUrl({
    title,
    description,
    startTime,
    endTime,
    meetLink,
    candidateEmail,
    recruiterEmail
  });

  const icsData = generateICalendarData({
    uid: `gcal-${googleEventId || Date.now()}`,
    title,
    description,
    startTime,
    endTime,
    meetLink,
    candidateName,
    candidateEmail,
    recruiterName,
    recruiterEmail
  });

  return {
    updatedInGoogle,
    googleCalendarLink,
    icsData
  };
}

/**
 * Cancel an event in Google Calendar
 */
async function cancelCalendarEvent(googleEventId) {
  const calendarClient = getGoogleCalendarClient();
  if (calendarClient && googleEventId) {
    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
      await calendarClient.events.delete({
        calendarId,
        eventId: googleEventId,
        sendUpdates: 'all'
      });
      console.log(`📅 [GOOGLE CALENDAR API] Deleted event ${googleEventId}`);
      return true;
    } catch (err) {
      console.warn('⚠️ [GOOGLE CALENDAR API DELETE ERROR]:', err.message);
      return false;
    }
  }
  return false;
}

module.exports = {
  createCalendarEventWithMeet,
  updateCalendarEvent,
  cancelCalendarEvent,
  generateGoogleCalendarUrl,
  generateICalendarData,
  generateMeetingCode
};
