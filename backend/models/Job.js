const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  options: [{ type: String, required: true, trim: true }],
  correctAnswer: { type: Number, required: true, min: 0 },
  skill: { type: String, default: '', trim: true },
  difficulty: { type: String, default: 'intermediate', enum: ['beginner', 'intermediate', 'advanced'] },
  explanation: { type: String, default: '', trim: true }
}, { _id: true });

const assessmentSchema = new mongoose.Schema({
  title: { type: String, default: 'Technical Skill Assessment', trim: true },
  description: { type: String, default: '', trim: true },
  skill: { type: String, default: '', trim: true },
  passingThreshold: { type: Number, default: 60, min: 0, max: 100 },
  timeLimit: { type: Number, default: 15, min: 1, max: 180 }, // Duration in minutes
  isEnabled: { type: Boolean, default: true },
  questions: [questionSchema]
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  skillsRequired: [{ type: String, trim: true, required: true }],
  experienceRequired: { type: Number, default: 0 },
  location: { type: String, trim: true, default: 'Remote' },
  salary: { type: String, trim: true, default: 'Competitive' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  
  // Recruiter Decided Overall Passing Grade Threshold (%)
  overallPassingThreshold: { type: Number, default: 60, min: 30, max: 100 },

  // Multiple assessment rounds/modules per job
  assessments: [assessmentSchema],
  // Single assessment fallback for backward compatibility
  assessment: { type: assessmentSchema, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);
