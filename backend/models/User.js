const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectSchema = new mongoose.Schema({
  title: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  technologies: [{ type: String, trim: true }]
}, { _id: false });

const educationSchema = new mongoose.Schema({
  degree: { type: String, trim: true, default: '' },
  institution: { type: String, trim: true, default: '' },
  year: { type: Number }
}, { _id: false });

const warningHistorySchema = new mongoose.Schema({
  warningNumber: { type: Number, required: true },
  maxWarnings: { type: Number, default: 3 },
  timestamp: { type: Date, default: Date.now },
  resumeFileName: { type: String, default: '' },
  discrepancies: [{ type: String }],
  missingSkills: [{ type: String }],
  matchScore: { type: Number, default: 0 }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['candidate', 'recruiter'], default: 'candidate', required: true },
  phone: { type: String, trim: true, default: '' },
  photoURL: { type: String, default: '' },

  // Verification Badges & Trust Score
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isCompanyVerified: { type: Boolean, default: false },
  trustScore: { type: Number, default: 0 },

  // Recruiter specific fields
  company: { type: String, trim: true, default: '' },
  companyWebsite: { type: String, trim: true, default: '' },
  companyRegNumber: { type: String, trim: true, default: '' },
  companyVerifiedAt: { type: Date },
  companyVerificationDetails: { type: mongoose.Schema.Types.Mixed },

  // Candidate profile fields
  skills: [{ type: String, trim: true }],
  experience: { type: Number, default: 0 },
  preferredRole: { type: String, trim: true, default: '' },
  preferredLocation: { type: String, trim: true, default: '' },
  education: { type: educationSchema, default: () => ({}) },
  projects: [projectSchema],

  // Resume Verification & 3-Warning Permanent Strike Protocol
  isResumeVerified: { type: Boolean, default: false },
  resumeFileName: { type: String, default: '' },
  resumeScore: { type: Number, default: 0 },
  resumeVerifiedAt: { type: Date },
  verifiedSkills: [{ type: String, trim: true }],
  warningsCount: { type: Number, default: 0, min: 0, max: 3 },
  warningHistory: [warningHistorySchema],
  accountStatus: { 
    type: String, 
    enum: ['active', 'warning_issued', 'verified', 'rejected'], 
    default: 'active' 
  },
  isSuspended: { type: Boolean, default: false },
  rejectionReason: { type: String, default: '' }
}, {
  timestamps: true
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
