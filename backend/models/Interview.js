const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  application: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Application', 
    required: true 
  },
  job: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true 
  },
  candidate: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recruiter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true,
    default: 'Technical Interview' 
  },
  description: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  durationMinutes: { 
    type: Number, 
    default: 45 
  },
  timeZone: { 
    type: String, 
    default: 'UTC' 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'rescheduled', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  meetLink: { 
    type: String, 
    required: true,
    trim: true 
  },
  googleEventId: { 
    type: String, 
    default: '' 
  },
  googleCalendarLink: { 
    type: String, 
    default: '' 
  },
  calendarEventCreated: { 
    type: Boolean, 
    default: false 
  },
  candidateEmail: { 
    type: String, 
    trim: true 
  },
  candidateName: { 
    type: String, 
    trim: true 
  },
  recruiterEmail: { 
    type: String, 
    trim: true 
  },
  recruiterName: { 
    type: String, 
    trim: true 
  },
  recruiterFeedback: { 
    type: String, 
    default: '' 
  }
}, {
  timestamps: true
});

interviewSchema.index({ application: 1 });
interviewSchema.index({ candidate: 1, startTime: 1 });
interviewSchema.index({ recruiter: 1, startTime: 1 });
interviewSchema.index({ job: 1 });

module.exports = mongoose.models.Interview || mongoose.model('Interview', interviewSchema);
