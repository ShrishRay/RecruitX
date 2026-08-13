const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { computeMatchScore } = require('./matchingEngine');

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
  const r1 = await User.create({ name: 'Sarah Chen', email: 'sarah@techcorp.com', password: 'password123', role: 'recruiter', company: 'TechCorp Solutions', phone: '+1 (555) 019-2834', isEmailVerified: true, isPhoneVerified: true, trustScore: 100 });
  const r2 = await User.create({ name: 'Marcus Williams', email: 'marcus@innovate.io', password: 'password123', role: 'recruiter', company: 'Innovate.io', phone: '+1 (555) 349-8120', isEmailVerified: true, isPhoneVerified: false, trustScore: 50 });
  const r3 = await User.create({ name: 'Priya Sharma', email: 'priya@dataflow.ai', password: 'password123', role: 'recruiter', company: 'DataFlow AI', phone: '+1 (555) 981-4321', isEmailVerified: true, isPhoneVerified: true, trustScore: 100 });
  const recruiters = [r1, r2, r3];

  // ── Create Candidates ─────────────────────────────────
  const candidates = [];
  const candidateData = [
    {
      name: 'Alex Rivera', email: 'alex@email.com', password: 'password123', role: 'candidate',
      phone: '+1 (555) 432-1098', isEmailVerified: true, isPhoneVerified: false, trustScore: 50,
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'GraphQL'], experience: 4,
      projects: [
        { title: 'E-commerce Platform', description: 'Built a full-stack e-commerce platform with React and Node.js, featuring real-time inventory management', technologies: ['React', 'Node.js', 'Stripe', 'MongoDB'] },
        { title: 'Task Management App', description: 'Developed a collaborative task management application with real-time updates', technologies: ['React', 'Express', 'Socket.io'] }
      ],
      education: { degree: 'B.S. Computer Science', institution: 'Stanford University', year: 2020 },
      preferredRole: 'Full Stack Developer', preferredLocation: 'San Francisco'
    },
    {
      name: 'Jordan Mitchell', email: 'jordan@email.com', password: 'password123', role: 'candidate',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Docker'], experience: 3,
      projects: [
        { title: 'Image Classification System', description: 'Built a CNN-based image classification system achieving 95% accuracy', technologies: ['Python', 'TensorFlow', 'OpenCV'] },
        { title: 'Recommendation Engine', description: 'Developed a collaborative filtering recommendation engine', technologies: ['Python', 'scikit-learn', 'Flask'] }
      ],
      education: { degree: 'M.S. Data Science', institution: 'MIT', year: 2021 },
      preferredRole: 'ML Engineer', preferredLocation: 'Remote'
    },
    {
      name: 'Sophia Nguyen', email: 'sophia@email.com', password: 'password123', role: 'candidate',
      skills: ['React', 'Vue.js', 'CSS', 'Figma', 'JavaScript', 'Tailwind'], experience: 5,
      projects: [
        { title: 'Design System Library', description: 'Created a comprehensive UI component library with 40+ components', technologies: ['React', 'Storybook', 'Tailwind CSS'] },
        { title: 'Analytics Dashboard', description: 'Designed and developed a real-time analytics dashboard with interactive charts', technologies: ['Vue.js', 'D3.js', 'CSS'] }
      ],
      education: { degree: 'B.A. Design & CS', institution: 'Carnegie Mellon', year: 2019 },
      preferredRole: 'Frontend Developer', preferredLocation: 'New York'
    },
    {
      name: 'Ethan Park', email: 'ethan@email.com', password: 'password123', role: 'candidate',
      skills: ['Java', 'Spring Boot', 'AWS', 'Kubernetes', 'PostgreSQL'], experience: 6,
      projects: [
        { title: 'Microservices Platform', description: 'Architected and deployed a microservices platform handling 10K+ req/sec', technologies: ['Java', 'Spring Boot', 'Kubernetes', 'AWS'] },
        { title: 'Payment Gateway', description: 'Built a secure payment processing gateway with PCI DSS compliance', technologies: ['Java', 'Spring Security', 'PostgreSQL'] }
      ],
      education: { degree: 'M.S. Software Engineering', institution: 'Georgia Tech', year: 2018 },
      preferredRole: 'Backend Developer', preferredLocation: 'Seattle'
    },
    {
      name: 'Mia Johnson', email: 'mia@email.com', password: 'password123', role: 'candidate',
      skills: ['React', 'Node.js', 'Python', 'AWS', 'MongoDB', 'Docker'], experience: 5,
      projects: [
        { title: 'SaaS Platform', description: 'Led development of a multi-tenant SaaS platform serving 500+ businesses', technologies: ['React', 'Node.js', 'MongoDB', 'AWS'] },
        { title: 'CI/CD Pipeline', description: 'Implemented automated CI/CD pipelines reducing deployment time by 80%', technologies: ['Docker', 'Jenkins', 'AWS'] }
      ],
      education: { degree: 'B.S. Computer Engineering', institution: 'UC Berkeley', year: 2019 },
      preferredRole: 'Full Stack Developer', preferredLocation: 'San Francisco'
    },
    {
      name: 'Liam O\'Connor', email: 'liam@email.com', password: 'password123', role: 'candidate',
      skills: ['Python', 'Django', 'React', 'PostgreSQL', 'Redis'], experience: 2,
      projects: [
        { title: 'Social Media API', description: 'Built a RESTful API for a social media platform with real-time notifications', technologies: ['Django', 'PostgreSQL', 'Redis'] }
      ],
      education: { degree: 'B.S. Computer Science', institution: 'University of Washington', year: 2022 },
      preferredRole: 'Backend Developer', preferredLocation: 'Remote'
    },
    {
      name: 'Isabella Torres', email: 'isabella@email.com', password: 'password123', role: 'candidate',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'GraphQL', 'MongoDB'], experience: 3,
      projects: [
        { title: 'Healthcare Portal', description: 'Developed a HIPAA-compliant healthcare portal with appointment scheduling', technologies: ['React', 'Node.js', 'GraphQL', 'MongoDB'] },
        { title: 'Real-time Chat App', description: 'Built a scalable real-time chat application supporting 1000+ concurrent users', technologies: ['React', 'Socket.io', 'Node.js'] }
      ],
      education: { degree: 'B.S. Information Systems', institution: 'NYU', year: 2021 },
      preferredRole: 'Full Stack Developer', preferredLocation: 'New York'
    },
    {
      name: 'David Kim', email: 'david@email.com', password: 'password123', role: 'candidate',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'NLP', 'SQL', 'Docker'], experience: 4,
      projects: [
        { title: 'NLP Chatbot', description: 'Built an intelligent chatbot using transformer models for customer support', technologies: ['Python', 'PyTorch', 'FastAPI', 'Docker'] },
        { title: 'Fraud Detection System', description: 'Developed a real-time fraud detection system using ensemble ML models', technologies: ['Python', 'scikit-learn', 'Kafka'] }
      ],
      education: { degree: 'M.S. AI & Machine Learning', institution: 'CMU', year: 2020 },
      preferredRole: 'ML Engineer', preferredLocation: 'San Francisco'
    }
  ];

  for (const data of candidateData) {
    const c = await User.create(data);
    candidates.push(c);
  }

  // ── Create Jobs ────────────────────────────────────────
  const jobsData = [
    { title: 'Senior Full Stack Developer', description: 'We are looking for an experienced Full Stack Developer to join our product team. You will be responsible for building and maintaining our web platform, working with React on the frontend and Node.js on the backend. Experience with MongoDB and cloud services is a plus.', skillsRequired: ['React', 'Node.js', 'MongoDB', 'TypeScript'], experienceRequired: 4, location: 'San Francisco', salary: '$130K - $160K', postedBy: recruiters[0]._id, isActive: true },
    { title: 'Frontend Engineer', description: 'Join our design-focused engineering team to build beautiful, performant user interfaces. Strong CSS skills and experience with modern frontend frameworks are essential.', skillsRequired: ['React', 'CSS', 'JavaScript', 'Figma', 'Tailwind'], experienceRequired: 3, location: 'New York', salary: '$110K - $140K', postedBy: recruiters[0]._id, isActive: true },
    { title: 'Machine Learning Engineer', description: 'We are seeking a talented ML Engineer to develop and deploy machine learning models for our AI-powered analytics platform. Strong Python skills and experience with deep learning frameworks are required.', skillsRequired: ['Python', 'TensorFlow', 'Machine Learning', 'SQL', 'Docker'], experienceRequired: 3, location: 'Remote', salary: '$140K - $170K', postedBy: recruiters[1]._id, isActive: true },
    { title: 'Backend Developer (Java)', description: 'Looking for a senior backend developer to architect and build scalable microservices. Experience with cloud infrastructure and containerization is essential.', skillsRequired: ['Java', 'Spring Boot', 'AWS', 'Kubernetes', 'PostgreSQL'], experienceRequired: 5, location: 'Seattle', salary: '$150K - $180K', postedBy: recruiters[1]._id, isActive: true },
    { title: 'Full Stack Developer', description: 'DataFlow AI is looking for a versatile full stack developer to build our next-generation data pipeline management platform. Experience with data processing and visualization is a plus.', skillsRequired: ['React', 'Node.js', 'Python', 'MongoDB', 'Docker'], experienceRequired: 3, location: 'San Francisco', salary: '$120K - $150K', postedBy: recruiters[2]._id, isActive: true },
    { title: 'AI/ML Research Engineer', description: 'Join our research team to push the boundaries of applied AI. You will work on cutting-edge NLP and computer vision problems.', skillsRequired: ['Python', 'PyTorch', 'NLP', 'TensorFlow', 'Docker'], experienceRequired: 4, location: 'San Francisco', salary: '$160K - $200K', postedBy: recruiters[2]._id, isActive: true },
  ];

  const jobs = [];
  for (const data of jobsData) {
    const j = await Job.create(data);
    jobs.push(j);
  }

  // ── Create Applications ────────────────────────────────
  const pairs = [
    [0, 0], [0, 4],       // Alex → Full Stack roles
    [1, 2], [1, 5],       // Jordan → ML roles
    [2, 1], [2, 0],       // Sophia → Frontend + Full Stack
    [3, 3],               // Ethan → Backend Java
    [4, 0], [4, 4],       // Mia → Full Stack
    [5, 4],               // Liam → Full Stack
    [6, 0], [6, 4],       // Isabella → Full Stack
    [7, 2], [7, 5],       // David → ML/AI
  ];

  const apps = [];
  for (const [ci, ji] of pairs) {
    const score = computeMatchScore(candidates[ci], jobs[ji]);
    const app = await Application.create({
      candidate: candidates[ci]._id,
      job: jobs[ji]._id,
      matchScore: score,
      status: 'applied',
      appliedAt: new Date()
    });
    apps.push(app);
  }

  // Mark some as shortlisted/rejected for demo
  if (apps.length > 0) await Application.findByIdAndUpdate(apps[0]._id, { status: 'shortlisted' });
  if (apps.length > 1) await Application.findByIdAndUpdate(apps[1]._id, { status: 'shortlisted' });
  if (apps.length > 3) await Application.findByIdAndUpdate(apps[3]._id, { status: 'rejected' });

  console.log(`   Created ${recruiters.length} recruiters`);
  console.log(`   Created ${candidates.length} candidates`);
  console.log(`   Created ${jobs.length} jobs`);
  console.log(`   Created ${apps.length} applications`);
}

module.exports = { seedDatabase };
