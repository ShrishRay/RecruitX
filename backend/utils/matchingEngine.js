/**
 * RecruitX Matching Engine
 * 
 * Computes a match score between a candidate profile and a job posting.
 * 
 * Formula:
 *   Match Score = (0.7 × Skill Match) + (0.2 × Experience Match) + (0.1 × Keyword Similarity)
 * 
 * Each component returns a value 0–100. Final score is 0–100.
 */

/**
 * Calculate Jaccard similarity between two arrays of strings.
 * Returns a value 0–100.
 * 
 * @param {string[]} candidateSkills - Skills the candidate has
 * @param {string[]} jobSkills - Skills the job requires
 */
function calculateSkillMatch(candidateSkills, jobSkills) {
  if (!jobSkills || jobSkills.length === 0) return 100; // No skills required = perfect match
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  // Normalize to lowercase for case-insensitive comparison
  const normalizedCandidate = candidateSkills.map(s => s.toLowerCase().trim());
  const normalizedJob = jobSkills.map(s => s.toLowerCase().trim());

  const candidateSet = new Set(normalizedCandidate);
  const jobSet = new Set(normalizedJob);

  // Count how many required skills the candidate has
  let matchCount = 0;
  for (const skill of jobSet) {
    if (candidateSet.has(skill)) {
      matchCount++;
    }
  }

  // Use coverage ratio (how many required skills are met) rather than Jaccard
  // This is more intuitive: having extra skills shouldn't penalize the candidate
  const score = (matchCount / jobSet.size) * 100;
  return Math.round(score * 100) / 100;
}

/**
 * Calculate experience match score.
 * Normalized using: max(0, 1 - |candidateExp - requiredExp| / max(requiredExp, 1))
 * Returns 0–100.
 * 
 * @param {number} candidateExp - Candidate's years of experience
 * @param {number} requiredExp - Job's required years of experience
 */
function calculateExperienceMatch(candidateExp, requiredExp) {
  if (requiredExp === 0) return 100; // No experience required
  
  const diff = Math.abs(candidateExp - requiredExp);
  const normalized = Math.max(0, 1 - diff / Math.max(requiredExp, 1));
  
  return Math.round(normalized * 100 * 100) / 100;
}

/**
 * Calculate keyword similarity between candidate text and job description.
 * Uses term frequency matching (simplified TF approach).
 * Returns 0–100.
 * 
 * @param {object} candidate - Candidate user object
 * @param {object} job - Job object
 */
function calculateKeywordSimilarity(candidate, job) {
  // Build candidate text from projects, education, preferred role
  const candidateTexts = [];
  
  if (candidate.projects && candidate.projects.length > 0) {
    candidate.projects.forEach(p => {
      if (p.title) candidateTexts.push(p.title);
      if (p.description) candidateTexts.push(p.description);
      if (p.technologies) candidateTexts.push(p.technologies.join(' '));
    });
  }
  
  if (candidate.education) {
    if (candidate.education.degree) candidateTexts.push(candidate.education.degree);
    if (candidate.education.institution) candidateTexts.push(candidate.education.institution);
  }
  
  if (candidate.preferredRole) candidateTexts.push(candidate.preferredRole);

  const candidateText = candidateTexts.join(' ').toLowerCase();
  const jobText = (job.description + ' ' + job.title).toLowerCase();

  if (!candidateText || !jobText) return 0;

  // Extract meaningful words (remove common stop words)
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
    'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'each',
    'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such',
    'than', 'too', 'very', 'just', 'about', 'up', 'out', 'if', 'then',
    'that', 'this', 'these', 'those', 'it', 'its', 'we', 'our', 'you',
    'your', 'they', 'their', 'he', 'she', 'him', 'her', 'who', 'which',
    'what', 'when', 'where', 'how', 'why', 'also', 'well', 'like', 'work',
    'working', 'using', 'used', 'use'
  ]);

  function extractTokens(text) {
    return text
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  const jobTokens = extractTokens(jobText);
  const candidateTokens = new Set(extractTokens(candidateText));

  if (jobTokens.length === 0) return 0;

  // Count how many job description tokens appear in candidate text
  const uniqueJobTokens = [...new Set(jobTokens)];
  let matchCount = 0;
  
  for (const token of uniqueJobTokens) {
    if (candidateTokens.has(token)) {
      matchCount++;
    }
  }

  const score = (matchCount / uniqueJobTokens.length) * 100;
  return Math.round(score * 100) / 100;
}

/**
 * Compute the overall match score between a candidate and a job.
 * 
 * @param {object} candidate - Populated User document (candidate)
 * @param {object} job - Job document
 * @returns {number} Match score 0–100
 */
function computeMatchScore(candidate, job) {
  const skillScore = calculateSkillMatch(candidate.skills, job.skillsRequired);
  const experienceScore = calculateExperienceMatch(candidate.experience, job.experienceRequired);
  const keywordScore = calculateKeywordSimilarity(candidate, job);

  // Weighted formula
  const finalScore = (0.7 * skillScore) + (0.2 * experienceScore) + (0.1 * keywordScore);

  return Math.round(finalScore * 100) / 100;
}

module.exports = {
  computeMatchScore,
  calculateSkillMatch,
  calculateExperienceMatch,
  calculateKeywordSimilarity
};
