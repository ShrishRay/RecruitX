const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, getDBStatus } = require('./config/db');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const matchRoutes = require('./routes/matchRoutes');
const interviewRoutes = require('./routes/interviewRoutes');

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/interviews', interviewRoutes);

// ── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const { OPEN_SOURCE_MODEL } = require('./utils/llmResumeValidator');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: getDBStatus(),
    llmEngine: {
      model: OPEN_SOURCE_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
      type: 'Open-Source Large Language Model',
      corroborationPipeline: 'Active'
    }
  });
});

// ── Error handling middleware ────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ── Start server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 RecruitX API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
  });

  try {
    await connectDB();
    if (process.env.NODE_ENV === 'development') {
      try {
        const { seedDatabase } = require('./utils/seedData');
        await seedDatabase();
        console.log('✅ Sample data seeded');
      } catch (err) {
        console.log('⚠️  Seed skipped or already seeded:', err.message);
      }
    }
  } catch (err) {
    console.error('Database connection error on startup:', err);
  }
};

startServer();
