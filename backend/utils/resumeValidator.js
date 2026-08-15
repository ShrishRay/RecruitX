const zlib = require('zlib');

/**
 * Extract human-readable text from a PDF Buffer or Base64 string
 */
function extractTextFromPdf(pdfData, clientProvidedText = '') {
  if (clientProvidedText && typeof clientProvidedText === 'string' && clientProvidedText.trim().length >= 5) {
    return clientProvidedText.trim();
  }

  if (!pdfData) return '';

  let buffer;
  if (Buffer.isBuffer(pdfData)) {
    buffer = pdfData;
  } else if (typeof pdfData === 'string') {
    const base64Index = pdfData.indexOf(';base64,');
    const base64Str = base64Index !== -1 ? pdfData.substring(base64Index + 8) : pdfData;
    buffer = Buffer.from(base64Str, 'base64');
  } else {
    return '';
  }

  const pdfStr = buffer.toString('binary');
  let extractedText = '';

  // 1. Try to extract plain PDF text objects enclosed in BT ... ET
  const textObjectRegex = /BT[\s\S]*?ET/g;
  const textMatches = pdfStr.match(textObjectRegex) || [];

  for (const block of textMatches) {
    const literalMatches = block.match(/\((.*?)\)/g) || [];
    for (const lit of literalMatches) {
      extractedText += ' ' + lit.slice(1, -1);
    }

    const hexMatches = block.match(/<([0-9a-fA-F]+)>/g) || [];
    for (const h of hexMatches) {
      try {
        const hexStr = h.slice(1, -1);
        const decoded = Buffer.from(hexStr, 'hex').toString('utf8');
        extractedText += ' ' + decoded;
      } catch (e) {
        // Ignore hex parsing error
      }
    }
  }

  // 2. Try to decompress FlateDecode streams if text is empty
  if (!extractedText.trim()) {
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let streamMatch;
    while ((streamMatch = streamRegex.exec(pdfStr)) !== null) {
      try {
        const streamBuffer = Buffer.from(streamMatch[1], 'binary');
        const decompressed = zlib.inflateSync(streamBuffer).toString('utf8');
        const innerLiterals = decompressed.match(/\((.*?)\)/g) || [];
        for (const lit of innerLiterals) {
          extractedText += ' ' + lit.slice(1, -1);
        }
      } catch (err) {
        // Ignore decompression errors on non-flate streams
      }
    }
  }

  // 3. Fallback: extract ASCII word sequences
  if (!extractedText.trim()) {
    const asciiWords = pdfStr.match(/[A-Za-z0-9#+.\-_/ ]{4,}/g) || [];
    extractedText = asciiWords.filter(w => !w.includes('Font') && !w.includes('Catalog') && !w.includes('Obj')).join(' ');
  }

  return extractedText.replace(/\\[nrtbf]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Skill synonyms and alias map for robust, real-world matching
 */
const SKILL_SYNONYMS = {
  'react': ['react', 'react.js', 'reactjs', 'react native'],
  'node.js': ['node', 'node.js', 'nodejs', 'express', 'express.js'],
  'node': ['node', 'node.js', 'nodejs'],
  'vue': ['vue', 'vue.js', 'vuejs'],
  'angular': ['angular', 'angular.js', 'angularjs', 'angular 2+'],
  'typescript': ['typescript', 'ts'],
  'javascript': ['javascript', 'js', 'es6', 'ecmascript'],
  'python': ['python', 'py', 'django', 'flask', 'fastapi'],
  'mongodb': ['mongo', 'mongodb', 'mongoose', 'nosql'],
  'sql': ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle', 'mssql', 'relational'],
  'postgresql': ['postgresql', 'postgres', 'psql'],
  'docker': ['docker', 'containerization', 'containers', 'dockerfile'],
  'kubernetes': ['kubernetes', 'k8s', 'container orchestration'],
  'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloud'],
  'gcp': ['gcp', 'google cloud', 'google cloud platform'],
  'azure': ['azure', 'microsoft azure'],
  'machine learning': ['machine learning', 'ml', 'deep learning', 'ai', 'artificial intelligence', 'tensorflow', 'pytorch', 'scikit-learn'],
  'tailwind': ['tailwind', 'tailwindcss', 'tailwind css'],
  'css': ['css', 'css3', 'sass', 'scss', 'styling', 'responsive design'],
  'html': ['html', 'html5'],
  'graphql': ['graphql', 'apollo', 'gql'],
  'java': ['java', 'spring', 'spring boot', 'j2ee'],
  'c++': ['c++', 'cpp'],
  'c#': ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
  'git': ['git', 'github', 'gitlab', 'version control'],
  'ci/cd': ['ci/cd', 'cicd', 'jenkins', 'github actions', 'pipeline'],
  'figma': ['figma', 'ui/ux', 'design systems', 'wireframing'],
  'redis': ['redis', 'caching', 'in-memory db'],
  'golang': ['go', 'golang'],
  'rust': ['rust', 'cargo']
};

/**
 * Check if a skill exists in resume text
 */
function isSkillInResume(skillName, resumeLower) {
  const norm = skillName.trim().toLowerCase();
  if (!norm) return true;

  const directTerms = SKILL_SYNONYMS[norm] || [norm];

  for (const term of directTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(^|[^a-zA-Z0-9_#+])${escaped}([^a-zA-Z0-9_#+]|$)`, 'i');
    if (pattern.test(resumeLower) || resumeLower.includes(term)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract structured candidate information from resume text to auto-fill profile
 */
function parseResumeIntoProfile(resumeText) {
  if (!resumeText) return {};

  const lower = resumeText.toLowerCase();

  // 1. Extract Skills
  const recognizedSkills = [
    'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'MongoDB',
    'GraphQL', 'PostgreSQL', 'SQL', 'Docker', 'Kubernetes', 'AWS', 'GCP',
    'Azure', 'Tailwind CSS', 'CSS', 'HTML', 'Java', 'Spring Boot', 'C++',
    'C#', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Figma', 'Git',
    'CI/CD', 'Redis', 'Vue.js', 'Angular', 'Django', 'FastAPI', 'Flask'
  ];

  const extractedSkills = recognizedSkills.filter(skill => isSkillInResume(skill, lower));

  // 2. Extract Experience Years
  let experience = 0;
  const expMatch = resumeText.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of\s+experience)?/i);
  if (expMatch) {
    experience = parseInt(expMatch[1], 10);
  } else {
    // Estimate from year ranges (e.g. 2020 - 2024 -> 4 yrs)
    const years = resumeText.match(/\b(20[0-2][0-9]|199[0-9])\b/g) || [];
    if (years.length >= 2) {
      const nums = years.map(Number).sort((a, b) => a - b);
      const span = nums[nums.length - 1] - nums[0];
      if (span > 0 && span <= 20) experience = span;
    }
  }

  // 3. Extract Target / Current Role
  const roleKeywords = [
    'Full Stack Developer', 'Full Stack Engineer', 'Frontend Engineer',
    'Frontend Developer', 'Backend Developer', 'Backend Engineer',
    'Machine Learning Engineer', 'ML Engineer', 'AI Research Engineer',
    'DevOps Engineer', 'Cloud Architect', 'Software Engineer', 'Data Scientist'
  ];

  let preferredRole = '';
  for (const role of roleKeywords) {
    if (lower.includes(role.toLowerCase())) {
      preferredRole = role;
      break;
    }
  }
  if (!preferredRole) preferredRole = 'Software Engineer';

  // 4. Extract Education
  const degreeKeywords = [
    'B.S. Computer Science', 'M.S. Computer Science', 'B.S. Software Engineering',
    'M.S. Data Science', 'B.S. Information Systems', 'B.A. Design & CS',
    'B.Tech Computer Science', 'M.S. AI & Machine Learning', 'B.S. Computer Engineering'
  ];

  let degree = '';
  for (const deg of degreeKeywords) {
    if (lower.includes(deg.toLowerCase()) || lower.includes(deg.replace(/B\.S\.|M\.S\.|B\.A\./g, '').trim().toLowerCase())) {
      degree = deg;
      break;
    }
  }
  if (!degree) {
    const degGeneral = resumeText.match(/(?:Bachelor|Master|B\.S\.|M\.S\.|B\.Tech|B\.E\.)[^\n,]+/i);
    if (degGeneral) degree = degGeneral[0].trim();
  }

  const universityKeywords = [
    'Stanford University', 'MIT', 'Massachusetts Institute of Technology',
    'Carnegie Mellon University', 'CMU', 'UC Berkeley', 'Georgia Tech',
    'Harvard University', 'New York University', 'NYU', 'University of Washington',
    'Cornell University', 'University of Texas'
  ];

  let institution = '';
  for (const uni of universityKeywords) {
    if (lower.includes(uni.toLowerCase())) {
      institution = uni;
      break;
    }
  }
  if (!institution) {
    const instGeneral = resumeText.match(/(?:University|Institute|College)[^\n,]+/i);
    if (instGeneral) institution = instGeneral[0].trim();
  }

  let gradYear = '';
  const gradMatch = resumeText.match(/\b(201[5-9]|202[0-8])\b/);
  if (gradMatch) gradYear = gradMatch[1];

  // 5. Extract Projects
  const extractedProjects = [];
  const projectPatterns = [
    { title: 'E-commerce Platform', tech: ['React', 'Node.js', 'MongoDB', 'Stripe'], desc: 'Built a full-stack e-commerce platform with real-time inventory and payments' },
    { title: 'Task Management App', tech: ['React', 'Express', 'Socket.io'], desc: 'Collaborative task management application with real-time synchronization' },
    { title: 'Machine Learning Image Classifier', tech: ['Python', 'TensorFlow', 'Docker'], desc: 'Deep learning CNN model for high-accuracy image recognition' },
    { title: 'Cloud Microservices Architecture', tech: ['Java', 'Spring Boot', 'AWS', 'Kubernetes'], desc: 'Scalable microservices platform handling high concurrent workloads' },
    { title: 'Design System Component Library', tech: ['React', 'Tailwind CSS', 'Figma'], desc: 'Accessible reusable UI library with modern animation tokens' }
  ];

  for (const p of projectPatterns) {
    if (lower.includes(p.title.toLowerCase()) || p.tech.some(t => isSkillInResume(t, lower))) {
      extractedProjects.push({
        title: p.title,
        description: p.desc,
        technologies: p.tech.filter(t => isSkillInResume(t, lower))
      });
    }
  }

  return {
    skills: extractedSkills.length > 0 ? extractedSkills : ['React', 'JavaScript', 'HTML', 'CSS'],
    experience: experience || 3,
    preferredRole,
    preferredLocation: lower.includes('remote') ? 'Remote' : lower.includes('san francisco') ? 'San Francisco' : lower.includes('new york') ? 'New York' : 'Remote',
    education: {
      degree: degree || 'B.S. Computer Science',
      institution: institution || 'State University',
      year: gradYear || '2021'
    },
    projects: extractedProjects.length > 0 ? extractedProjects.slice(0, 3) : [
      {
        title: 'Full Stack Web Platform',
        description: 'Developed full stack responsive application with authentication and database storage',
        technologies: extractedSkills.slice(0, 3)
      }
    ]
  };
}

/**
 * Validate full candidate profile against extracted resume text
 */
function validateResumeWithProfile(profile, resumeText) {
  const resumeLower = (resumeText || '').toLowerCase();
  const discrepancies = [];

  const verifiedSkills = [];
  const missingSkills = [];

  const candidateSkills = Array.isArray(profile.skills) ? profile.skills : [];

  // 1. Validate Technical Skills
  if (candidateSkills.length === 0) {
    discrepancies.push('Your profile has no technical skills listed. Please add skills or click "Auto-Fill Profile" from your resume.');
  } else {
    for (const skill of candidateSkills) {
      if (isSkillInResume(skill, resumeLower)) {
        verifiedSkills.push(skill);
      } else {
        missingSkills.push(skill);
        discrepancies.push(`Claimed skill "${skill}" in profile is completely missing from the uploaded resume.`);
      }
    }
  }

  // 2. Validate Education
  let isEducationVerified = true;
  if (profile.education && profile.education.institution) {
    const instWords = profile.education.institution.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const hasInstMatch = instWords.some(w => resumeLower.includes(w));
    if (!hasInstMatch && profile.education.institution.trim().length > 3) {
      isEducationVerified = false;
      discrepancies.push(`Education institution "${profile.education.institution}" is not corroborated in the resume.`);
    }
  }

  if (profile.education && profile.education.degree) {
    const degWords = profile.education.degree.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const hasDegreeMatch = degWords.some(w => resumeLower.includes(w));
    if (!hasDegreeMatch && profile.education.degree.trim().length > 3) {
      isEducationVerified = false;
      discrepancies.push(`Education degree "${profile.education.degree}" is not corroborated in the resume.`);
    }
  }

  // 3. Validate Projects
  const verifiedProjects = [];
  const missingProjects = [];
  const candidateProjects = Array.isArray(profile.projects) ? profile.projects : [];

  for (const project of candidateProjects) {
    if (!project.title || !project.title.trim()) continue;
    const titleWords = project.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const hasTitleMatch = titleWords.some(w => resumeLower.includes(w));
    
    const techsInProject = project.technologies || [];
    const techMatchCount = techsInProject.filter(t => isSkillInResume(t, resumeLower)).length;

    if (hasTitleMatch || (techsInProject.length > 0 && techMatchCount >= Math.ceil(techsInProject.length / 2))) {
      verifiedProjects.push(project.title);
    } else {
      missingProjects.push(project.title);
      discrepancies.push(`Project "${project.title}" was not found in the resume.`);
    }
  }

  const totalSkillsCount = candidateSkills.length || 1;
  const skillMatchRatio = candidateSkills.length > 0 ? (verifiedSkills.length / totalSkillsCount) : 0;
  const matchScore = Math.round(
    (skillMatchRatio * 70) + 
    (isEducationVerified ? 15 : 0) + 
    ((candidateProjects.length > 0 ? verifiedProjects.length / candidateProjects.length : 1) * 15)
  );

  const isValid = candidateSkills.length > 0 && missingSkills.length === 0 && discrepancies.length === 0;

  return {
    isValid,
    matchScore,
    verifiedSkills,
    missingSkills,
    verifiedProjects,
    missingProjects,
    isEducationVerified,
    discrepancies,
    discrepancyCount: discrepancies.length,
    resumeTextSnippet: resumeText.slice(0, 300) + (resumeText.length > 300 ? '...' : '')
  };
}

module.exports = {
  extractTextFromPdf,
  parseResumeIntoProfile,
  validateResumeWithProfile
};
