const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { computeMatchScore } = require('./matchingEngine');
const { generateAssessmentForSkills } = require('./assessmentGenerator');

/**
 * Seed the MongoDB database with realistic sample data for demo purposes.
 * Skips seeding if data already exists (persistent across restarts).
 */
async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    throw new Error('Database already has data — skipping seed');
  }

  console.log('🌱 Seeding database with sample data...');

  // ── Create Recruiters ─────────────────────────────────
  const r1 = await User.create({ 
    name: 'Sarah Chen', 
    email: 'sarah@techcorp.com', 
    password: 'password123', 
    role: 'recruiter', 
    company: 'TechCorp Solutions', 
    companyWebsite: 'https://techcorp.com',
    companyRegNumber: 'CIN-U72200DL2018PTC334512',
    phone: '+1 (555) 019-2834', 
    isEmailVerified: true, 
    isPhoneVerified: true, 
    isCompanyVerified: true,
    companyVerifiedAt: new Date().toISOString(),
    companyVerificationDetails: {
      registeredEntityName: 'TechCorp Solutions Inc.',
      officialWebsite: 'https://techcorp.com',
      domain: 'techcorp.com',
      registrationId: 'CIN-U72200DL2018PTC334512',
      registryStatus: 'Active & In Good Standing',
      sslVerified: true,
      emailDomainMatch: true,
      verifiedRegistry: 'MCA (Ministry of Corporate Affairs)'
    },
    trustScore: 100 
  });

  const r2 = await User.create({ 
    name: 'Marcus Williams', 
    email: 'marcus@innovate.io', 
    password: 'password123', 
    role: 'recruiter', 
    company: 'Innovate.io', 
    companyWebsite: 'https://innovate.io',
    companyRegNumber: 'US-EIN-83-2948102',
    phone: '+1 (555) 349-8120', 
    isEmailVerified: true, 
    isPhoneVerified: false, 
    isCompanyVerified: false,
    trustScore: 30 
  });

  const r3 = await User.create({ 
    name: 'Priya Sharma', 
    email: 'priya@dataflow.ai', 
    password: 'password123', 
    role: 'recruiter', 
    company: 'DataFlow AI', 
    companyWebsite: 'https://dataflow.ai',
    companyRegNumber: 'CIN-U72900KA2020PTC142980',
    phone: '+1 (555) 981-4321', 
    isEmailVerified: true, 
    isPhoneVerified: true, 
    isCompanyVerified: true,
    companyVerifiedAt: new Date().toISOString(),
    companyVerificationDetails: {
      registeredEntityName: 'DataFlow AI Technologies Pvt Ltd',
      officialWebsite: 'https://dataflow.ai',
      domain: 'dataflow.ai',
      registrationId: 'CIN-U72900KA2020PTC142980',
      registryStatus: 'Active & In Good Standing',
      sslVerified: true,
      emailDomainMatch: true,
      verifiedRegistry: 'MCA (Ministry of Corporate Affairs)'
    },
    trustScore: 100 
  });
  const recruiters = [r1, r2, r3];

  // ── Create Candidates ─────────────────────────────────
  const candidates = [];
  const candidateData = [
    {
      name: 'Alex Rivera', email: 'alex@email.com', password: 'password123', role: 'candidate',
      phone: '+1 (555) 432-1098', isEmailVerified: true, isPhoneVerified: true, trustScore: 100,
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'GraphQL'], experience: 4,
      isResumeVerified: false, warningsCount: 0,
      projects: [
        { title: 'E-commerce Platform', description: 'Built a full-stack e-commerce platform with React and Node.js', technologies: ['React', 'Node.js', 'MongoDB'] }
      ],
      education: { degree: 'B.S. Computer Science', institution: 'Stanford University', year: 2020 },
      preferredRole: 'Full Stack Developer', preferredLocation: 'San Francisco'
    },
    {
      name: 'Jordan Mitchell', email: 'jordan@email.com', password: 'password123', role: 'candidate',
      phone: '+1 (555) 321-7654', isEmailVerified: true, isPhoneVerified: true, trustScore: 100,
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Docker'], experience: 3,
      isResumeVerified: true, resumeScore: 100, verifiedSkills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Docker'],
      resumeFileName: 'Jordan_Mitchell_ML_Resume.pdf', warningsCount: 0,
      projects: [
        { title: 'Image Classification System', description: 'Built a CNN-based image classification system', technologies: ['Python', 'TensorFlow'] }
      ],
      education: { degree: 'M.S. Data Science', institution: 'MIT', year: 2021 },
      preferredRole: 'ML Engineer', preferredLocation: 'Remote'
    },
    {
      name: 'Sophia Nguyen', email: 'sophia@email.com', password: 'password123', role: 'candidate',
      phone: '+1 (555) 654-9870', isEmailVerified: true, isPhoneVerified: true, trustScore: 100,
      skills: ['React', 'Vue.js', 'CSS', 'Figma', 'JavaScript', 'Tailwind CSS'], experience: 5,
      isResumeVerified: true, resumeScore: 100, verifiedSkills: ['React', 'Vue.js', 'CSS', 'Figma', 'JavaScript', 'Tailwind CSS'],
      resumeFileName: 'Sophia_Frontend_Design_Resume.pdf', warningsCount: 0,
      projects: [
        { title: 'Design System Library', description: 'Created a comprehensive UI component library', technologies: ['React', 'Tailwind CSS'] }
      ],
      education: { degree: 'B.A. Design & CS', institution: 'Carnegie Mellon', year: 2019 },
      preferredRole: 'Frontend Developer', preferredLocation: 'New York'
    },
    {
      name: 'Ethan Park', email: 'ethan@email.com', password: 'password123', role: 'candidate',
      phone: '+1 (555) 876-5432', isEmailVerified: true, isPhoneVerified: true, trustScore: 100,
      skills: ['Java', 'Spring Boot', 'AWS', 'Kubernetes', 'PostgreSQL'], experience: 6,
      isResumeVerified: true, resumeScore: 100, verifiedSkills: ['Java', 'Spring Boot', 'AWS', 'Kubernetes', 'PostgreSQL'],
      resumeFileName: 'Ethan_Park_Backend.pdf', warningsCount: 0,
      projects: [
        { title: 'Microservices Platform', description: 'Architected scalable microservices platform', technologies: ['Java', 'Spring Boot', 'AWS'] }
      ],
      education: { degree: 'M.S. Software Engineering', institution: 'Georgia Tech', year: 2018 },
      preferredRole: 'Backend Developer', preferredLocation: 'Seattle'
    },
    {
      name: 'Mia Johnson', email: 'mia@email.com', password: 'password123', role: 'candidate',
      phone: '+1 (555) 234-5678', isEmailVerified: true, isPhoneVerified: true, trustScore: 100,
      skills: ['React', 'Node.js', 'Python', 'AWS', 'MongoDB', 'Docker'], experience: 5,
      isResumeVerified: true, resumeScore: 100, verifiedSkills: ['React', 'Node.js', 'Python', 'AWS', 'MongoDB', 'Docker'],
      resumeFileName: 'Mia_FullStack_Resume.pdf', warningsCount: 0,
      education: { degree: 'B.S. Computer Engineering', institution: 'UC Berkeley', year: 2019 },
      preferredRole: 'Full Stack Developer', preferredLocation: 'San Francisco'
    },
    {
      name: 'Lucas Silva', email: 'lucas@email.com', password: 'password123', role: 'candidate',
      phone: '+1 (555) 789-0123', isEmailVerified: true, isPhoneVerified: false, trustScore: 50,
      skills: ['Kubernetes', 'Golang', 'Rust', 'Docker', 'AWS'], experience: 4,
      warningsCount: 1, accountStatus: 'warning_issued', isResumeVerified: false,
      warningHistory: [
        { warningNumber: 1, maxWarnings: 3, timestamp: new Date().toISOString(), resumeFileName: 'Customer_Support_CV.pdf', discrepancies: ['Claimed skill "Kubernetes" was missing from uploaded resume.'], missingSkills: ['Kubernetes'], matchScore: 30 }
      ],
      education: { degree: 'B.S. Computer Science', institution: 'State University', year: 2021 },
      preferredRole: 'DevOps Engineer', preferredLocation: 'Austin'
    },
    {
      name: 'Chloe Zhang', email: 'chloe@email.com', password: 'password123', role: 'candidate',
      phone: '+1 (555) 890-1234', isEmailVerified: true, isPhoneVerified: true, trustScore: 100,
      skills: ['React', 'Node.js', 'Python', 'TensorFlow', 'AWS', 'PostgreSQL'], experience: 5,
      warningsCount: 2, accountStatus: 'warning_issued', isResumeVerified: false,
      warningHistory: [
        { warningNumber: 1, maxWarnings: 3, timestamp: new Date(Date.now() - 86400000).toISOString(), resumeFileName: 'Incomplete_Resume_v1.pdf', discrepancies: ['Skills Python, TensorFlow missing'], missingSkills: ['Python', 'TensorFlow'], matchScore: 40 },
        { warningNumber: 2, maxWarnings: 3, timestamp: new Date().toISOString(), resumeFileName: 'Generic_Sales_Resume.pdf', discrepancies: ['Skills React, Node.js missing'], missingSkills: ['React', 'Node.js'], matchScore: 20 }
      ],
      education: { degree: 'M.S. Computer Science', institution: 'Columbia University', year: 2020 },
      preferredRole: 'Full Stack Developer', preferredLocation: 'New York'
    },
    {
      name: 'Nathan Cole', email: 'nathan@email.com', password: 'password123', role: 'candidate',
      phone: '+1 (555) 901-2345', isEmailVerified: true, isPhoneVerified: true, trustScore: 100,
      skills: ['C++', 'Rust', 'Embedded Systems', 'Linux Kernel'], experience: 7,
      warningsCount: 3, accountStatus: 'rejected', isSuspended: true, isResumeVerified: false,
      rejectionReason: 'Account permanently rejected: 3 warnings issued for unverified profile claims missing from uploaded PDF resumes.',
      education: { degree: 'B.S. Electrical Engineering', institution: 'Purdue University', year: 2017 },
      preferredRole: 'Systems Engineer', preferredLocation: 'Boston'
    },
    {
      name: 'Elena Rostova', email: 'elena@email.com', password: 'password123', role: 'candidate',
      phone: '+1 (555) 345-6789', isEmailVerified: true, isPhoneVerified: true, trustScore: 100,
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'], experience: 4,
      isResumeVerified: true, resumeScore: 100, verifiedSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      resumeFileName: 'Elena_Rostova_FullStack_Verified.pdf', warningsCount: 0,
      projects: [
        { title: 'Fintech Banking Dashboard', description: 'Interactive real-time transaction ledger', technologies: ['React', 'TypeScript', 'PostgreSQL'] }
      ],
      education: { degree: 'B.S. Computer Science', institution: 'Stanford University', year: 2021 },
      preferredRole: 'Full Stack Engineer', preferredLocation: 'San Francisco'
    },
    {
      name: 'Tariq Mansoor', email: 'tariq@email.com', password: 'password123', role: 'candidate',
      phone: '+1 (555) 456-7890', isEmailVerified: false, isPhoneVerified: false, trustScore: 0,
      skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Redis'], experience: 2,
      isResumeVerified: false, warningsCount: 0,
      education: { degree: 'B.S. Software Engineering', institution: 'UT Austin', year: 2023 },
      preferredRole: 'Backend Developer', preferredLocation: 'Remote'
    },
    {
      name: 'Atharva Vinod Joshi', email: 'atharv1132006@gmail.com', password: 'password123', role: 'candidate',
      phone: '8805611378', isEmailVerified: true, isPhoneVerified: true, trustScore: 100,
      skills: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'MongoDB', 'Python', 'AWS'], experience: 3,
      isResumeVerified: true, resumeScore: 100, verifiedSkills: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'MongoDB'],
      resumeFileName: 'ATHARVA_JOSHI_Resume.pdf', warningsCount: 0,
      projects: [
        { title: 'AI Recruitment Platform', description: 'Full-stack platform with LLM resume corroboration and verification pipeline', technologies: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS'] }
      ],
      education: { degree: 'B.Tech Computer Engineering', institution: 'Engineering University', year: 2025 },
      preferredRole: 'Full Stack Engineer', preferredLocation: 'Remote'
    }
  ];

  for (const data of candidateData) {
    const c = await User.create(data);
    candidates.push(c);
  }

  // ── Create Jobs with Technical Skill Assessments & Thresholds ─────────
  const rawJobs = [
    { title: 'Senior Full Stack Developer', description: 'We are looking for an experienced Full Stack Developer to join our product team. You will be responsible for building and maintaining our web platform, working with React on the frontend and Node.js on the backend.', skillsRequired: ['React', 'Node.js', 'MongoDB', 'TypeScript'], experienceRequired: 4, location: 'San Francisco', salary: '$130K - $160K', postedBy: recruiters[0]._id, threshold: 60 },
    { title: 'Frontend Engineer', description: 'Join our design-focused engineering team to build beautiful, performant user interfaces. Strong CSS skills and experience with modern frontend frameworks are essential.', skillsRequired: ['React', 'CSS', 'JavaScript', 'Figma', 'Tailwind CSS'], experienceRequired: 3, location: 'New York', salary: '$110K - $140K', postedBy: recruiters[0]._id, threshold: 65 },
    { title: 'Machine Learning Engineer', description: 'We are seeking a talented ML Engineer to develop and deploy machine learning models for our AI-powered analytics platform.', skillsRequired: ['Python', 'TensorFlow', 'Machine Learning', 'SQL', 'Docker'], experienceRequired: 3, location: 'Remote', salary: '$140K - $170K', postedBy: recruiters[1]._id, threshold: 70 },
    { title: 'Backend Developer (Java)', description: 'Looking for a senior backend developer to architect and build scalable microservices. Experience with cloud infrastructure is essential.', skillsRequired: ['Java', 'Spring Boot', 'AWS', 'Kubernetes', 'PostgreSQL'], experienceRequired: 5, location: 'Seattle', salary: '$150K - $180K', postedBy: recruiters[1]._id, threshold: 60 },
    { title: 'Full Stack Developer', description: 'DataFlow AI is looking for a versatile full stack developer to build our next-generation data pipeline platform.', skillsRequired: ['React', 'Node.js', 'Python', 'MongoDB', 'Docker'], experienceRequired: 3, location: 'San Francisco', salary: '$120K - $150K', postedBy: recruiters[2]._id, threshold: 60 },
    { title: 'AI/ML Research Engineer', description: 'Join our research team to push the boundaries of applied AI.', skillsRequired: ['Python', 'PyTorch', 'NLP', 'TensorFlow', 'Docker'], experienceRequired: 4, location: 'San Francisco', salary: '$160K - $200K', postedBy: recruiters[2]._id, threshold: 75 }
  ];

  const jobs = [];
  for (const item of rawJobs) {
    const assessment = generateAssessmentForSkills(item.skillsRequired, item.title, item.threshold);
    const j = await Job.create({
      title: item.title,
      description: item.description,
      skillsRequired: item.skillsRequired,
      experienceRequired: item.experienceRequired,
      location: item.location,
      salary: item.salary,
      postedBy: item.postedBy,
      isActive: true,
      assessment
    });
    jobs.push(j);
  }

  // ── Create Applications (Candidates with Assessment Scores) ───────────
  // Candidates with verified resume + score > 50% + assessment >= threshold are 100% Qualified for Shortlisting
  const sampleApps = [
    // Elena Rostova (Verified, Match 85%, Assessment 100% -> Qualified for Shortlisting)
    { candidateIdx: 8, jobIdx: 0, assessmentScore: 100, assessmentPassed: true, status: 'shortlisted' },
    // Atharva Joshi (Verified, Match 90%, Assessment 85% -> Qualified for Shortlisting)
    { candidateIdx: 10, jobIdx: 0, assessmentScore: 85, assessmentPassed: true, status: 'shortlisted' },
    // Mia Johnson (Verified, Match 75%, Assessment 80% -> Qualified for Shortlisting)
    { candidateIdx: 4, jobIdx: 0, assessmentScore: 80, assessmentPassed: true, status: 'applied' },
    // Alex Rivera (Resume Unverified, Match 85%, Assessment 75% -> Pending Resume Verification)
    { candidateIdx: 0, jobIdx: 0, assessmentScore: 75, assessmentPassed: true, status: 'applied' },
    // Jordan Mitchell (ML Engineer on ML job: Verified, Match 95%, Assessment 90% -> Qualified)
    { candidateIdx: 1, jobIdx: 2, assessmentScore: 90, assessmentPassed: true, status: 'shortlisted' },
    // Sophia Nguyen (Frontend Dev: Verified, Match 90%, Assessment 85% -> Qualified)
    { candidateIdx: 2, jobIdx: 1, assessmentScore: 85, assessmentPassed: true, status: 'shortlisted' },
    // Ethan Park (Java Dev: Verified, Match 85%, Assessment 80% -> Qualified)
    { candidateIdx: 3, jobIdx: 3, assessmentScore: 80, assessmentPassed: true, status: 'applied' },
    // Lucas Silva (1 Warning, Resume Unverified, Assessment not taken)
    { candidateIdx: 5, jobIdx: 3, assessmentScore: null, assessmentPassed: false, status: 'applied' }
  ];

  for (const appItem of sampleApps) {
    const cand = candidates[appItem.candidateIdx];
    const job = jobs[appItem.jobIdx];
    const matchScore = computeMatchScore(cand, job);
    await Application.create({
      candidate: cand._id,
      job: job._id,
      matchScore,
      status: appItem.status,
      assessmentScore: appItem.assessmentScore,
      assessmentPassed: appItem.assessmentPassed,
      assessmentTakenAt: appItem.assessmentScore !== null ? new Date() : null,
      appliedAt: new Date()
    });
  }

  console.log(`   Created ${recruiters.length} recruiters`);
  console.log(`   Created ${candidates.length} candidates`);
  console.log(`   Created ${jobs.length} jobs with technical assessments`);
  console.log(`   Created ${sampleApps.length} applications with assessment scores`);
}

module.exports = { seedDatabase };
