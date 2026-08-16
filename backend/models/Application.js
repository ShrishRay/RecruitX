const mongoose = require('mongoose');

const assessmentResultSchema = new mongoose.Schema({
  assessmentId: { type: String, required: true },
  title: { type: String, default: 'Skill Assessment' },
  skill: { type: String, default: '' },
  score: { type: Number, required: true },
  passingThreshold: { type: Number, default: 60 },
  passed: { type: Boolean, required: true },
  takenAt: { type: Date, default: Date.now },
  answers: [{
    questionIndex: Number,
    selectedOption: Number,
    isCorrect: Boolean,
    questionText: String,
    skill: String
  }]
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  matchScore: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['applied', 'shortlisted', 'rejected', 'hired'], 
    default: 'applied' 
  },
  appliedAt: { type: Date, default: Date.now },
  notes: { type: String, default: '' },

  // Multiple Assessment results array
  assessmentResults: [assessmentResultSchema],
  allAssessmentsPassed: { type: Boolean, default: false },
  overallAssessmentScore: { type: Number, default: null },

  // Backward compatibility fields
  assessmentScore: { type: Number, default: null },
  assessmentPassed: { type: Boolean, default: false },
  assessmentTakenAt: { type: Date, default: null },
  assessmentAnswers: [{
    questionIndex: Number,
    selectedOption: Number,
    isCorrect: Boolean,
    questionText: String,
    skill: String
  }],

  // Interview Scheduling
  interviewScheduled: { type: Boolean, default: false },
  interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', default: null }
}, {
  timestamps: true
});

applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.models.Application || mongoose.model('Application', applicationSchema);
