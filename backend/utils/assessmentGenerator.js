/**
 * Technical Skill Assessment Question Bank & Multiple Assessment Generator
 */

const QUESTION_BANK = {
  'react': [
    {
      question: 'Which React hook should be used to perform side effects such as data fetching or subscriptions?',
      options: ['useState', 'useEffect', 'useMemo', 'useCallback'],
      correctAnswer: 1,
      skill: 'React',
      difficulty: 'beginner',
      explanation: 'useEffect is designed specifically to synchronize with external systems and execute side effects.'
    },
    {
      question: 'What is the primary benefit of using React.memo or useMemo?',
      options: [
        'To force synchronous DOM re-rendering',
        'To prevent unnecessary re-computations and re-renders through memoization',
        'To directly modify browser window state',
        'To handle global server-side routing'
      ],
      correctAnswer: 1,
      skill: 'React',
      difficulty: 'intermediate',
      explanation: 'Memoization caches results based on dependency inputs to skip expensive calculations and re-renders.'
    },
    {
      question: 'In React 18, how does the useId hook help with accessibility and SSR?',
      options: [
        'It generates unique, stable IDs across server and client to prevent hydration mismatch bugs',
        'It encrypts user authentication tokens',
        'It generates CSS color palettes',
        'It replaces React Router'
      ],
      correctAnswer: 0,
      skill: 'React',
      difficulty: 'advanced',
      explanation: 'useId produces unique, consistent IDs on both server and client without hydration mismatches.'
    }
  ],
  'node.js': [
    {
      question: 'What mechanism does Node.js use to achieve high throughput non-blocking I/O operations?',
      options: ['Multi-threaded OS Kernel locks', 'Single-threaded Event Loop with Libuv', 'Synchronous thread pooling for every socket', 'Shared memory IPC semaphores'],
      correctAnswer: 1,
      skill: 'Node.js',
      difficulty: 'intermediate',
      explanation: 'Node.js delegates I/O tasks to Libuv and processes events via a single-threaded non-blocking event loop.'
    },
    {
      question: 'In Express.js / Node.js, what is the role of middleware functions?',
      options: [
        'They replace the MongoDB database driver',
        'They access req and res objects, execute code, and call next()',
        'They compile TypeScript to WASM binary',
        'They manage OS kernel memory allocation'
      ],
      correctAnswer: 1,
      skill: 'Node.js',
      difficulty: 'beginner',
      explanation: 'Middleware functions have access to request and response objects and execute intermediate logic.'
    },
    {
      question: 'What is the purpose of the Node.js Worker Threads module?',
      options: [
        'To run CPU-intensive computational tasks in background worker threads without blocking the event loop',
        'To manage CSS grid layouts',
        'To auto-restart crashed servers',
        'To encrypt HTTP traffic'
      ],
      correctAnswer: 0,
      skill: 'Node.js',
      difficulty: 'advanced',
      explanation: 'worker_threads enables executing heavy CPU tasks (like crypto or image processing) in separate threads.'
    }
  ],
  'typescript': [
    {
      question: 'What is the difference between "interface" and "type" in TypeScript?',
      options: [
        'Types cannot define object shapes',
        'Interfaces support declaration merging, whereas types can represent unions and primitives',
        'Interfaces are compiled to JavaScript runtime objects',
        'Types cannot be used with generic parameters'
      ],
      correctAnswer: 1,
      skill: 'TypeScript',
      difficulty: 'intermediate',
      explanation: 'Interfaces allow declaration merging and object inheritance, while type aliases can represent union and intersection types.'
    },
    {
      question: 'What does the "unknown" type enforce in TypeScript compared to "any"?',
      options: [
        'It permits any property access without checking',
        'It requires type narrowing or type assertions before performing operations on the value',
        'It always casts values to null',
        'It disables all compile-time lint checks'
      ],
      correctAnswer: 1,
      skill: 'TypeScript',
      difficulty: 'intermediate',
      explanation: 'unknown is the type-safe counterpart of any. TypeScript forces you to narrow the type before operating on it.'
    }
  ],
  'python': [
    {
      question: 'In Python, what is the primary purpose of a generator function using "yield"?',
      options: [
        'To terminate the thread execution',
        'To lazily produce a sequence of values on-demand with minimal memory footprint',
        'To force synchronous database commits',
        'To bypass Global Interpreter Lock (GIL)'
      ],
      correctAnswer: 1,
      skill: 'Python',
      difficulty: 'intermediate',
      explanation: 'Generators return an iterator that yields one item at a time lazily without loading the entire collection into memory.'
    },
    {
      question: 'How do list comprehensions in Python compare to traditional for-loops?',
      options: [
        'They are purely decorative and execute slower',
        'They provide a concise syntax and often execute faster at C-level bytecode',
        'They can only be used with numeric data types',
        'They cannot contain conditional if-statements'
      ],
      correctAnswer: 1,
      skill: 'Python',
      difficulty: 'beginner',
      explanation: 'List comprehensions offer concise syntax and optimized C-level execution in CPython.'
    }
  ],
  'mongodb': [
    {
      question: 'In MongoDB, what aggregation pipeline stage is used to filter documents before subsequent transformations?',
      options: ['$group', '$match', '$project', '$lookup'],
      correctAnswer: 1,
      skill: 'MongoDB',
      difficulty: 'beginner',
      explanation: '$match filters the document stream to pass only matching documents to the next pipeline stage.'
    },
    {
      question: 'What type of index should you create in MongoDB to optimize queries on multiple fields together?',
      options: ['Single field index', 'Compound index', 'Text index', 'Geospatial 2dsphere index'],
      correctAnswer: 1,
      skill: 'MongoDB',
      difficulty: 'intermediate',
      explanation: 'Compound indexes contain references to multiple fields in a document to optimize compound queries.'
    }
  ],
  'postgresql': [
    {
      question: 'In PostgreSQL / SQL, what does an INNER JOIN return?',
      options: [
        'All rows from the left table regardless of matches',
        'Only rows where there is a matching value in both joined tables',
        'A Cartesian product of all rows in both tables',
        'Only rows that have NULL foreign keys'
      ],
      correctAnswer: 1,
      skill: 'PostgreSQL',
      difficulty: 'beginner',
      explanation: 'INNER JOIN selects all records from Table A and Table B where the specified join condition is met in both.'
    },
    {
      question: 'What ACID property guarantees that all operations within a database transaction succeed together or fail completely?',
      options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
      correctAnswer: 0,
      skill: 'PostgreSQL',
      difficulty: 'intermediate',
      explanation: 'Atomicity ensures that all statements in a transaction are executed as a single unit—all or nothing.'
    }
  ],
  'docker': [
    {
      question: 'What is the primary distinction between a Docker Image and a Docker Container?',
      options: [
        'A container is a read-only template, while an image is a running process',
        'An image is an immutable template/blueprint, while a container is a running instance of that image',
        'Containers cannot communicate over virtual networks',
        'Images can only be built on Linux kernel 2.6'
      ],
      correctAnswer: 1,
      skill: 'Docker',
      difficulty: 'beginner',
      explanation: 'A Docker Image is an immutable snapshot containing application code and dependencies; a container is the runnable instance.'
    }
  ],
  'aws': [
    {
      question: 'Which AWS service is designed for serverless execution of code in response to events with zero server management?',
      options: ['Amazon EC2', 'AWS Lambda', 'Amazon ECS', 'AWS CloudFormation'],
      correctAnswer: 1,
      skill: 'AWS',
      difficulty: 'beginner',
      explanation: 'AWS Lambda is an event-driven serverless compute service that runs code automatically without provisioning servers.'
    }
  ]
};

/**
 * Generate multiple skill-specific assessments for a job based on required skills
 */
function generateMultipleAssessmentsForSkills(skills = [], jobTitle = 'Software Engineer', defaultThreshold = 60, defaultTimeLimit = 15) {
  const normalizedSkills = Array.isArray(skills) && skills.length > 0 ? skills : ['General Engineering'];
  const assessments = [];

  normalizedSkills.slice(0, 4).forEach((skill, idx) => {
    const sLower = skill.toLowerCase().trim();
    let questions = [];

    // Find matching questions from question bank
    Object.keys(QUESTION_BANK).forEach(bankKey => {
      if (sLower.includes(bankKey) || bankKey.includes(sLower)) {
        questions.push(...QUESTION_BANK[bankKey]);
      }
    });

    if (questions.length < 2) {
      questions.push(
        {
          question: `In ${skill}, what is the best practice for modular code organization and testing?`,
          options: [
            'Placing all logic into one 5000-line file without tests',
            'Separating concerns into cohesive modules with unit and integration tests',
            'Disabling linting in production',
            'Hardcoding secret API keys in public repositories'
          ],
          correctAnswer: 1,
          skill: skill,
          difficulty: 'intermediate',
          explanation: 'Modular design with separation of concerns and automated testing promotes maintainability and reliability.'
        },
        {
          question: `Which approach optimizes performance and reliability when scaling ${skill} applications?`,
          options: [
            'Profiling performance metrics, caching frequent queries, and monitoring error rates',
            'Restarting servers manually every 10 minutes',
            'Disabling database indexes',
            'Removing error handling'
          ],
          correctAnswer: 0,
          skill: skill,
          difficulty: 'intermediate',
          explanation: 'System profiling, caching, and observability are core to scaling applications.'
        }
      );
    }

    assessments.push({
      title: `Round ${idx + 1}: ${skill} Competency Assessment`,
      description: `Evaluation module covering ${skill} proficiency, best practices, and architecture. Passing threshold: ${defaultThreshold}%. Time limit: ${defaultTimeLimit} minutes.`,
      skill: skill,
      passingThreshold: Number(defaultThreshold) || 60,
      timeLimit: Number(defaultTimeLimit) || 15,
      isEnabled: true,
      questions: questions.slice(0, 4)
    });
  });

  return assessments;
}

module.exports = {
  generateMultipleAssessmentsForSkills,
  QUESTION_BANK
};
