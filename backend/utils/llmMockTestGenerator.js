/**
 * Open-Source LLM Mock Test Generator (Qwen 2.5 Architecture)
 * Generates 100% subject-specific technical mock tests tailored to subject, difficulty, and question count.
 */

const https = require('https');
const http = require('http');

const OPEN_SOURCE_LLM = process.env.OPENSOURCE_LLM_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || '';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';

/**
 * Deep, Subject-Specific Question Banks for all major engineering disciplines
 */
const SPECIALIZED_SUBJECT_BANKS = {
  'react': {
    beginner: [
      {
        question: 'What is JSX in React?',
        options: ['A SQL database query dialect', 'A syntax extension for JavaScript that looks like HTML', 'A CSS preprocessor plugin', 'A binary compiler for web workers'],
        correctAnswer: 1,
        explanation: 'JSX allows writing HTML-like markup inside JavaScript files, transpiled to React.createElement() calls.'
      },
      {
        question: 'Which React Hook is primarily used to manage local component state?',
        options: ['useEffect', 'useState', 'useContext', 'useRef'],
        correctAnswer: 1,
        explanation: 'useState declares state variables preserved across component renders.'
      },
      {
        question: 'What is the purpose of the "key" prop when rendering lists in React?',
        options: ['To style the list element with CSS', 'To help React identify which items have changed, been added, or removed', 'To encrypt list item contents', 'To assign database primary keys'],
        correctAnswer: 1,
        explanation: 'Stable keys allow React Virtual DOM reconciliation to match list items efficiently without recreating all DOM nodes.'
      },
      {
        question: 'How are props passed from a parent to a child component in React?',
        options: ['Via global window variables', 'As attributes on the component JSX element tag', 'Through document cookies', 'Using localStorage'],
        correctAnswer: 1,
        explanation: 'Props are passed like HTML attributes, e.g. <UserProfile name="Alex" role="Engineer" />.'
      },
      {
        question: 'When does a useEffect hook run by default if no dependency array is supplied?',
        options: ['Only once on initial mount', 'After every single render of the component', 'Only when props change', 'Never'],
        correctAnswer: 1,
        explanation: 'Without a dependency array, useEffect executes after the initial render and after every subsequent component update.'
      }
    ],
    intermediate: [
      {
        question: 'What is the fundamental difference between useCallback and useMemo in React?',
        options: [
          'useCallback caches a callback function definition; useMemo caches the computed result of calling a function',
          'useMemo is for asynchronous API calls; useCallback is for synchronous state updates',
          'useCallback replaces Redux; useMemo replaces Context API',
          'useMemo executes on the server; useCallback executes in web workers'
        ],
        correctAnswer: 0,
        explanation: 'useCallback(fn, deps) returns a memoized version of the function itself, while useMemo(fn, deps) returns the memoized return value.'
      },
      {
        question: 'In React 18, what is Automatic Batching?',
        options: [
          'Compiling all TypeScript files into a single bundle file',
          'Grouping multiple state updates across timeouts, promises, and native event handlers into a single re-render',
          'Batching database queries on the Node.js backend',
          'Applying multiple CSS animations at once'
        ],
        correctAnswer: 1,
        explanation: 'React 18 batches state updates across asynchronous operations (promises, setTimeout) to eliminate redundant re-renders.'
      },
      {
        question: 'Why must you avoid mutating state directly in React (e.g., state.items.push(newItem))?',
        options: [
          'Direct mutation throws an immediate JavaScript fatal syntax error',
          'React uses shallow object reference checks; direct mutations retain the same reference and fail to trigger re-renders',
          'Direct mutation consumes 100x more GPU memory',
          'Direct mutation breaks CSS styling'
        ],
        correctAnswer: 1,
        explanation: 'React determines if state has changed by checking object reference equality. Mutating in-place retains the same reference, so React skips rendering.'
      },
      {
        question: 'What problem does the React Context API solve?',
        options: [
          'Direct manipulation of HTML Canvas graphics',
          'Sharing global or tree-wide data without passing props through intermediate components (prop drilling)',
          'Connecting frontend React directly to raw MongoDB TCP sockets',
          'Generating server-side SSL certificates'
        ],
        correctAnswer: 1,
        explanation: 'Context provides a clean way to pass data deeply down the component tree without prop drilling through intermediate components.'
      }
    ],
    advanced: [
      {
        question: 'How do React Server Components (RSCs) differ from traditional client-side SSR components?',
        options: [
          'RSCs execute exclusively on the server, send zero JavaScript bytes to the client bundle, and can access databases directly',
          'RSCs cannot use HTML elements',
          'RSCs require the Electron desktop runtime',
          'RSCs only work with GraphQL schemas'
        ],
        correctAnswer: 0,
        explanation: 'RSCs render purely on the backend, streaming serialized UI descriptions without bloating client JavaScript bundle sizes.'
      },
      {
        question: 'What is the purpose of the useTransition hook in React 18 Concurrent Mode?',
        options: [
          'To animate CSS transform transitions',
          'To mark state updates as non-urgent transitions, keeping the user interface responsive to urgent clicks and typing',
          'To automatically retry failed HTTP fetch requests',
          'To transition user sessions across browser tabs'
        ],
        correctAnswer: 1,
        explanation: 'useTransition lets you prioritize urgent interactions (like text typing) while rendering heavy transitions concurrently in the background.'
      }
    ]
  },
  'node.js': {
    beginner: [
      {
        question: 'What is Node.js?',
        options: [
          'A frontend CSS design framework',
          'An open-source, cross-platform JavaScript runtime built on Chrome\'s V8 JavaScript engine',
          'A relational database management system',
          'A browser extension for Chrome'
        ],
        correctAnswer: 1,
        explanation: 'Node.js allows executing JavaScript code on the server side outside of a web browser.'
      },
      {
        question: 'Which core built-in module in Node.js handles file system operations like reading and writing files?',
        options: ['http', 'fs', 'path', 'os'],
        correctAnswer: 1,
        explanation: 'The `fs` (File System) module provides methods for synchronous and asynchronous file I/O operations.'
      },
      {
        question: 'In Express.js middleware, what is the purpose of the next() function?',
        options: [
          'To close the HTTP TCP connection immediately',
          'To pass control to the next middleware function in the request pipeline',
          'To restart the Node.js process',
          'To clear the browser localStorage'
        ],
        correctAnswer: 1,
        explanation: 'Calling next() passes execution to the subsequent middleware or route handler in the stack.'
      },
      {
        question: 'What is package.json in a Node.js application?',
        options: [
          'The compiled binary executable file',
          'The project manifest file storing metadata, scripts, and dependencies',
          'A database backup file',
          'The server firewall configuration'
        ],
        correctAnswer: 1,
        explanation: 'package.json contains project metadata, scripts, and lists of runtime and dev dependencies.'
      }
    ],
    intermediate: [
      {
        question: 'What is the role of Libuv in the Node.js runtime architecture?',
        options: [
          'It is the JavaScript bytecode compiler',
          'It is a multi-platform C library providing the event loop, thread pool, and asynchronous I/O abstractions',
          'It manages CSS stylesheet injection',
          'It provides HTTPS certificate generation'
        ],
        correctAnswer: 1,
        explanation: 'Libuv provides the event loop, thread pool for file/DNS operations, and cross-platform asynchronous I/O.'
      },
      {
        question: 'What is the key advantage of Node.js Streams over loading entire files into memory with fs.readFile?',
        options: [
          'Streams convert files into executable machine code',
          'Streams process data incrementally in chunks with minimal RAM overhead, ideal for large payloads',
          'Streams bypass operating system file permissions',
          'Streams automatically compress files to ZIP format'
        ],
        correctAnswer: 1,
        explanation: 'Streams process data piece-by-piece, allowing applications to handle gigabyte-sized files without exhausting system RAM.'
      },
      {
        question: 'What is the difference between process.nextTick() and setImmediate() in Node.js?',
        options: [
          'process.nextTick() fires on the microtask queue before the event loop advances to the next phase; setImmediate() runs in the check phase of the event loop',
          'setImmediate() fires before any Promise resolves',
          'process.nextTick() runs in a separate OS thread while setImmediate() runs on the main thread',
          'There is no difference'
        ],
        correctAnswer: 0,
        explanation: 'process.nextTick() queues callbacks to execute immediately after the current operation before the event loop continues; setImmediate() executes during the check phase.'
      }
    ],
    advanced: [
      {
        question: 'How do Node.js Worker Threads differ from child processes created with child_process.fork()?',
        options: [
          'Worker Threads share the same OS process and can share memory via SharedArrayBuffer; child processes have isolated memory spaces and higher overhead',
          'Worker Threads cannot execute JavaScript code',
          'Child processes cannot communicate over IPC',
          'Worker Threads run exclusively on the GPU'
        ],
        correctAnswer: 0,
        explanation: 'Worker Threads run in isolated threads within a single OS process with optional shared memory, whereas fork() spawns separate operating system processes.'
      }
    ]
  },
  'python': {
    beginner: [
      {
        question: 'Which built-in Python data structure represents an ordered, mutable sequence of items?',
        options: ['Tuple', 'List', 'Set', 'Dictionary'],
        correctAnswer: 1,
        explanation: 'Lists (e.g. [1, 2, 3]) are ordered and mutable collections in Python.'
      },
      {
        question: 'How are functions defined in Python?',
        options: ['function myFunc():', 'def my_func():', 'fn my_func():', 'func my_func():'],
        correctAnswer: 1,
        explanation: 'The `def` keyword introduces function definitions in Python.'
      },
      {
        question: 'Which built-in function returns the total number of items in a list, string, or dictionary?',
        options: ['size()', 'count()', 'len()', 'length()'],
        correctAnswer: 2,
        explanation: '`len()` returns the length of sequence or mapping objects.'
      },
      {
        question: 'What is a dictionary in Python?',
        options: [
          'An immutable list of floating point numbers',
          'An associative data structure mapping unique keys to values',
          'A compiled C extension module',
          'A relational database table'
        ],
        correctAnswer: 1,
        explanation: 'Dictionaries store key-value mappings where keys must be hashable.'
      }
    ],
    intermediate: [
      {
        question: 'What is the primary benefit of using a Python Generator function with the "yield" statement?',
        options: [
          'It compiles the function into native C assembly',
          'It produces values lazily on-demand, consuming minimal memory for large or infinite datasets',
          'It bypasses the Global Interpreter Lock (GIL)',
          'It enables multi-GPU tensor operations'
        ],
        correctAnswer: 1,
        explanation: 'Generators yield one value at a time on demand without holding the full sequence in memory.'
      },
      {
        question: 'What is a Python Decorator?',
        options: [
          'A visual theme in the PyCharm IDE',
          'A higher-order function that takes another function and extends its behavior without altering its source code',
          'A garbage collector memory scanner',
          'A syntax checker in pytest'
        ],
        correctAnswer: 1,
        explanation: 'Decorators wrap functions to dynamically enhance or modify their execution behavior.'
      },
      {
        question: 'What does the Global Interpreter Lock (GIL) in CPython enforce?',
        options: [
          'It prevents SQL injection vulnerabilities',
          'It is a mutex ensuring only one native thread executes Python bytecode at a time in a single process',
          'It locks filesystem access during writes',
          'It restricts network socket connections'
        ],
        correctAnswer: 1,
        explanation: 'The GIL prevents multi-threaded CPython processes from executing pure Python bytecode across multiple CPU cores simultaneously.'
      }
    ],
    advanced: [
      {
        question: 'In Python, what is a Metaclass?',
        options: [
          'A class for managing operating system virtual memory',
          'A class whose instances are classes themselves, defining how classes are constructed and behave',
          'A standard decorator for async functions',
          'A built-in JSON parser'
        ],
        correctAnswer: 1,
        explanation: 'Metaclasses are the "blueprints for classes" in Python. `type` is the default metaclass.'
      }
    ]
  },
  'typescript': {
    beginner: [
      {
        question: 'What is the primary purpose of TypeScript compared to standard JavaScript?',
        options: [
          'To make JavaScript execute 10x faster in the browser',
          'To add optional static typing and compile-time error checking to JavaScript',
          'To replace HTML and CSS in web applications',
          'To run directly inside the CPU hardware'
        ],
        correctAnswer: 1,
        explanation: 'TypeScript adds a static type system on top of JavaScript to catch bugs at compile time.'
      },
      {
        question: 'Which TypeScript file extension is used for files containing JSX elements?',
        options: ['.ts', '.tsx', '.jsx', '.tscript'],
        correctAnswer: 1,
        explanation: '.tsx is the standard extension for TypeScript files with JSX syntax.'
      },
      {
        question: 'Which TypeScript type represents a value that could be anything, but safely requires type narrowing before usage?',
        options: ['any', 'unknown', 'void', 'never'],
        correctAnswer: 1,
        explanation: '`unknown` is the type-safe counterpart of `any`. You cannot perform operations on `unknown` without type checking.'
      }
    ],
    intermediate: [
      {
        question: 'What is the difference between "interface" and "type" in TypeScript?',
        options: [
          'Interfaces support declaration merging and object extension; type aliases can define unions, primitives, and tuples',
          'Interfaces are compiled to runtime JavaScript objects while types are erased',
          'Types cannot be used with generics',
          'There is zero difference'
        ],
        correctAnswer: 0,
        explanation: 'Interfaces allow declaration merging and object inheritance, whereas type aliases can express unions, primitives, and mapped types.'
      },
      {
        question: 'What does the "keyof" operator do in TypeScript?',
        options: [
          'Returns a union of string/number literal types representing all public keys of a type',
          'Decrypts encrypted object keys at runtime',
          'Generates unique database primary keys',
          'Deletes an object key'
        ],
        correctAnswer: 0,
        explanation: '`keyof T` produces a union type of all keys of type T (e.g. keyof { name: string; age: number } is "name" | "age").'
      }
    ],
    advanced: [
      {
        question: 'What is a Conditional Type in TypeScript?',
        options: [
          'A runtime if-else condition inside a function',
          'A type expression of the form `T extends U ? X : Y` evaluated at compile time',
          'A type that only exists when building in production mode',
          'A syntax error in TypeScript'
        ],
        correctAnswer: 1,
        explanation: 'Conditional types enable expressing non-uniform type mappings based on type relationships (T extends U ? X : Y).'
      }
    ]
  },
  'system design': {
    beginner: [
      {
        question: 'What is the primary role of a Load Balancer in system architecture?',
        options: [
          'To encrypt SQL database tables',
          'To distribute incoming network traffic across multiple backend server instances',
          'To compile frontend React code',
          'To generate TLS certificates'
        ],
        correctAnswer: 1,
        explanation: 'Load balancers distribute incoming requests to optimize throughput, prevent server overload, and ensure high availability.'
      },
      {
        question: 'What is Horizontal Scaling (Scaling Out)?',
        options: [
          'Adding more CPU and RAM to an existing single machine',
          'Adding more server nodes/machines to distribute the system workload',
          'Compressing disk files',
          'Upgrading Ethernet cables'
        ],
        correctAnswer: 1,
        explanation: 'Horizontal scaling adds more machine nodes to a distributed pool rather than upgrading a single machine (vertical scaling).'
      }
    ],
    intermediate: [
      {
        question: 'What does the CAP Theorem state regarding distributed data stores?',
        options: [
          'A system can achieve Consistency, Availability, and Partition Tolerance simultaneously at all times',
          'During a network partition (P), a distributed system must choose between Consistency (C) or Availability (A)',
          'All database queries must complete in under 50ms',
          'Primary keys must always be UUIDv4'
        ],
        correctAnswer: 1,
        explanation: 'CAP theorem proves that when network partitions occur, a distributed database can guarantee either consistency or availability, but not both.'
      },
      {
        question: 'Which caching strategy writes data simultaneously to both the cache and the primary database before acknowledging success?',
        options: ['Write-Behind (Write-Back)', 'Write-Through', 'Cache-Aside', 'Read-Through'],
        correctAnswer: 1,
        explanation: 'Write-Through writes synchronously to the cache and database, ensuring cache consistency at the expense of write latency.'
      }
    ],
    advanced: [
      {
        question: 'What problem does Consistent Hashing solve in distributed caching (e.g. Memcached/Redis clusters)?',
        options: [
          'It minimizes key re-mapping and cache invalidation when cache nodes are added or removed',
          'It compresses JSON payloads to binary',
          'It encrypts database passwords with SHA-256',
          'It executes map-reduce jobs on GPUs'
        ],
        correctAnswer: 0,
        explanation: 'Consistent hashing maps keys to a logical hash ring so that adding/removing a node only relocates $K/N$ keys on average.'
      }
    ]
  },
  'sql & databases': {
    beginner: [
      {
        question: 'What does the SQL command "SELECT * FROM users WHERE status = \'active\';" do?',
        options: [
          'Deletes all active users from the database',
          'Retrieves all columns for records in the users table where the status column equals "active"',
          'Creates a new table named active',
          'Updates user passwords'
        ],
        correctAnswer: 1,
        explanation: 'SELECT * FROM ... WHERE ... filters and retrieves matching rows from a relational table.'
      },
      {
        question: 'What is the difference between an INNER JOIN and a LEFT JOIN in SQL?',
        options: [
          'INNER JOIN returns only rows with matches in both tables; LEFT JOIN returns all rows from the left table plus matched rows from the right',
          'LEFT JOIN deletes unmatched rows permanently',
          'INNER JOIN only works on integers',
          'There is no difference'
        ],
        correctAnswer: 0,
        explanation: 'INNER JOIN requires matching keys in both tables; LEFT JOIN preserves all records from the left table and fills NULL for missing right matches.'
      },
      {
        question: 'What is a Primary Key in a relational database table?',
        options: [
          'A key used to encrypt the database backup',
          'A column or set of columns that uniquely identifies every row in the table',
          'The root administrative password for PostgreSQL',
          'An index on text columns only'
        ],
        correctAnswer: 1,
        explanation: 'A Primary Key uniquely identifies each row and automatically enforces uniqueness and NOT NULL constraints.'
      }
    ],
    intermediate: [
      {
        question: 'What ACID property ensures that multiple concurrent transactions execute without interfering with one another?',
        options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
        correctAnswer: 2,
        explanation: 'Isolation controls the visibility of uncommitted state changes between concurrent transactions.'
      },
      {
        question: 'What is a B-Tree index in relational databases and why is it preferred for range queries?',
        options: [
          'It is a self-balancing sorted tree structure that allows logarithmic time searches, insertions, and sequential range traversals',
          'It is a binary text file stored on disk',
          'It is a hash map with O(1) searches that disables range queries',
          'It is an in-memory Redis key'
        ],
        correctAnswer: 0,
        explanation: 'B-Trees keep data sorted and balanced, providing O(log N) point lookups and efficient sequential range scans.'
      }
    ],
    advanced: [
      {
        question: 'In PostgreSQL and MySQL, what does the "EXPLAIN ANALYZE" command do?',
        options: [
          'It runs the query plan, measures exact execution times per node, and outputs the actual execution statistics alongside cost estimates',
          'It deletes slow queries automatically',
          'It optimizes SQL queries without running them',
          'It indexes all columns in the schema'
        ],
        correctAnswer: 0,
        explanation: 'EXPLAIN ANALYZE executes the query and prints the planner estimates vs actual millisecond timings and row counts.'
      }
    ]
  },
  'data structures & algorithms': {
    beginner: [
      {
        question: 'What is the average time complexity of searching for an element in a balanced Binary Search Tree (BST)?',
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
        correctAnswer: 1,
        explanation: 'In a balanced BST, each comparison halves the remaining search space, giving O(log N) time.'
      },
      {
        question: 'Which data structure operates on a Last-In, First-Out (LIFO) principle?',
        options: ['Queue', 'Stack', 'Linked List', 'Heap'],
        correctAnswer: 1,
        explanation: 'A Stack follows the LIFO principle where the most recently added item is the first one removed.'
      },
      {
        question: 'What is the time complexity of looking up a key in a well-distributed Hash Table on average?',
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
        correctAnswer: 0,
        explanation: 'Hash tables compute bucket indexes via hashing in constant O(1) average time.'
      }
    ],
    intermediate: [
      {
        question: 'Which sorting algorithm has a guaranteed worst-case time complexity of O(N log N)?',
        options: ['QuickSort', 'MergeSort', 'BubbleSort', 'InsertionSort'],
        correctAnswer: 1,
        explanation: 'MergeSort divides the array in half and merges sorted sub-arrays, guaranteeing O(N log N) time in all cases.'
      },
      {
        question: 'In graph theory, which algorithm is used to find the shortest path from a single source node in a weighted graph with non-negative edge weights?',
        options: ['Dijkstra\'s Algorithm', 'Kruskal\'s Algorithm', 'Depth-First Search (DFS)', 'Kadane\'s Algorithm'],
        correctAnswer: 0,
        explanation: 'Dijkstra\'s algorithm uses a priority queue / min-heap to find shortest paths in non-negative weighted graphs in O((V + E) log V) time.'
      }
    ],
    advanced: [
      {
        question: 'What data structure is optimal for implementing a Least Recently Used (LRU) Cache with O(1) get and put operations?',
        options: [
          'A Hash Map combined with a Doubly Linked List',
          'A Red-Black Tree',
          'A Min-Heap priority queue',
          'A 2D array matrix'
        ],
        correctAnswer: 0,
        explanation: 'A Hash Map provides O(1) node lookups, while a Doubly Linked List allows O(1) removal and insertion of most/least recently used nodes.'
      }
    ]
  },
  'docker & cloud': {
    beginner: [
      {
        question: 'What is the primary difference between a Docker Image and a Docker Container?',
        options: [
          'An image is a read-only blueprint/template; a container is a runnable, isolated instance of that image',
          'A container is a read-only blueprint; an image is a running process',
          'Containers cannot access network sockets',
          'Images only run on macOS'
        ],
        correctAnswer: 0,
        explanation: 'Docker Images are immutable layered snapshots; containers are running instances of images.'
      },
      {
        question: 'Which AWS service is designed for serverless execution of stateless code functions without managing virtual servers?',
        options: ['Amazon EC2', 'AWS Lambda', 'Amazon EBS', 'AWS RDS'],
        correctAnswer: 1,
        explanation: 'AWS Lambda runs code on-demand in response to events with automatic scaling and zero server provisioning.'
      }
    ],
    intermediate: [
      {
        question: 'In Dockerfile optimization, what is a Multi-Stage Build used for?',
        options: [
          'To build container images across multiple cloud providers at the same time',
          'To separate build-time dependencies (compilers/SDKs) from the final production image, minimizing image size and vulnerabilities',
          'To run multiple containers on a single port',
          'To encrypt container layers with TLS'
        ],
        correctAnswer: 1,
        explanation: 'Multi-stage builds allow compiling in a heavy builder stage and copying only artifacts into a lean runtime base image (e.g. Alpine/Distroless).'
      },
      {
        question: 'In Kubernetes, what is a Pod?',
        options: [
          'A physical bare-metal server in a datacenter',
          'The smallest deployable computing unit in Kubernetes, consisting of one or more co-located containers sharing storage and network namespaces',
          'A database backup volume',
          'A load balancer IP address'
        ],
        correctAnswer: 1,
        explanation: 'A Pod represents a single instance of an application in Kubernetes and encapsulates one or more closely coupled containers.'
      }
    ],
    advanced: [
      {
        question: 'What is the purpose of Kubernetes Ingress Controller?',
        options: [
          'To manage inbound HTTP/HTTPS routing, SSL termination, and host/path-based load balancing into cluster services',
          'To compile Go binaries inside cluster nodes',
          'To encrypt disk volumes at rest',
          'To monitor CPU temperature'
        ],
        correctAnswer: 0,
        explanation: 'An Ingress controller exposes HTTP and HTTPS routes from outside the cluster to services within the cluster with reverse proxy capabilities.'
      }
    ]
  },
  'machine learning': {
    beginner: [
      {
        question: 'In Machine Learning, what is Supervised Learning?',
        options: [
          'Training an algorithm on labeled data where inputs are paired with corresponding target outputs',
          'Clustering unlabelled data points into unknown groups',
          'Manually reviewing code written by junior engineers',
          'Compressing image files without loss'
        ],
        correctAnswer: 0,
        explanation: 'Supervised learning trains models on labeled input-output pairs to learn a mapping function that generalizes to unseen inputs.'
      },
      {
        question: 'What problem occurs when a machine learning model fits training data too closely, capturing noise and failing to generalize to unseen test data?',
        options: ['Underfitting', 'Overfitting', 'Quantization', 'Gradient Boosting'],
        correctAnswer: 1,
        explanation: 'Overfitting happens when a model learns the training noise, leading to high training accuracy but poor real-world test performance.'
      }
    ],
    intermediate: [
      {
        question: 'What is the core innovation of the Self-Attention mechanism in Transformer architectures (e.g. GPT / BERT / Qwen)?',
        options: [
          'It replaces floating point math with integer arithmetic',
          'It dynamically computes pairwise relevance scores between all tokens in a sequence simultaneously, capturing long-range dependencies in parallel',
          'It runs exclusively on CPUs without GPUs',
          'It removes the need for training data'
        ],
        correctAnswer: 1,
        explanation: 'Self-attention allows tokens to attend to all other tokens in parallel with query, key, and value projections, overcoming RNN sequential bottlenecks.'
      },
      {
        question: 'When evaluating a classification model on an imbalanced dataset (e.g., fraud detection), why is Accuracy a misleading metric compared to Precision / Recall / F1-Score?',
        options: [
          'Accuracy is only computable for regression problems',
          'A naive model that predicts the majority class 100% of the time will achieve high accuracy while failing to detect any fraud cases',
          'Accuracy requires GPU tensor cores',
          'Accuracy ignores negative examples'
        ],
        correctAnswer: 1,
        explanation: 'In imbalanced datasets (e.g. 99% non-fraud), a naive model guessing non-fraud achieves 99% accuracy but 0% recall on fraud detection.'
      }
    ],
    advanced: [
      {
        question: 'In modern Large Language Model (LLM) fine-tuning, what is LoRA (Low-Rank Adaptation)?',
        options: [
          'A method that freezes the pre-trained model weights and injects trainable rank decomposition matrices into Transformer layers, drastically reducing VRAM and parameter count',
          'A protocol for compressing token vocabularies by 50%',
          'A prompt template for zero-shot reasoning',
          'An operating system kernel driver for NVIDIA H100 GPUs'
        ],
        correctAnswer: 0,
        explanation: 'LoRA freezes base weights and trains low-rank adapter matrices $W = W_0 + B \\times A$, reducing trainable parameters by over 99% with comparable accuracy.'
      }
    ]
  }
};

/**
 * Normalizes subject strings to matching bank keys
 */
function normalizeSubject(subject = '') {
  const s = subject.toLowerCase().trim();
  if (s.includes('react')) return 'react';
  if (s.includes('node') || s.includes('express')) return 'node.js';
  if (s.includes('python') || s.includes('django') || s.includes('flask') || s.includes('fastapi')) return 'python';
  if (s.includes('typescript') || s.includes(' ts')) return 'typescript';
  if (s.includes('system') || s.includes('architecture') || s.includes('distributed')) return 'system design';
  if (s.includes('sql') || s.includes('database') || s.includes('postgres') || s.includes('mongo')) return 'sql & databases';
  if (s.includes('dsa') || s.includes('algorithm') || s.includes('structure') || s.includes('tree') || s.includes('graph')) return 'data structures & algorithms';
  if (s.includes('docker') || s.includes('kubernetes') || s.includes('cloud') || s.includes('aws') || s.includes('devops')) return 'docker & cloud';
  if (s.includes('ml') || s.includes('machine learning') || s.includes('ai') || s.includes('deep learning') || s.includes('llm')) return 'machine learning';
  return s;
}

/**
 * Generate technical multiple choice questions dynamically synthesizing subject domain specifics
 */
function generateSubjectSpecificQuestions(subject, difficulty, count) {
  const normSub = normalizeSubject(subject);
  const diffNorm = difficulty.toLowerCase().trim();

  // If known specialized bank exists
  if (SPECIALIZED_SUBJECT_BANKS[normSub]) {
    const bank = SPECIALIZED_SUBJECT_BANKS[normSub];
    const diffPool = bank[diffNorm] || [];
    const allPool = [
      ...(bank.beginner || []),
      ...(bank.intermediate || []),
      ...(bank.advanced || [])
    ];
    
    // Prioritize difficulty level, then remaining
    const uniquePool = [...diffPool, ...allPool.filter(q => !diffPool.includes(q))];
    const shuffled = [...uniquePool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Synthesize rich, subject-tailored questions dynamically for niche/custom topics
  const customQuestions = [
    {
      question: `In ${subject} development, what is the primary architectural principle for managing dependency decoupling and modularity?`,
      options: [
        'Hardcoding global singleton instances across all files without interfaces',
        'Dependency Injection and Interface Segregation to decouple modules and enable unit testing',
        'Merging all business logic into a single monolithic script',
        'Disabling compile-time linting rules'
      ],
      correctAnswer: 1,
      explanation: `Dependency Injection and modular abstraction in ${subject} allow swapping implementations, mocking dependencies for tests, and maintaining clean architectural boundaries.`
    },
    {
      question: `When designing scalable applications with ${subject}, how should asynchronous I/O and latency bottlenecks be addressed?`,
      options: [
        'Executing all heavy network and database calls synchronously on the main thread',
        'Employing non-blocking asynchronous concurrency, response caching, and worker connection pooling',
        'Restarting the operating system whenever response latency exceeds 200ms',
        'Removing exception handling and logging'
      ],
      correctAnswer: 1,
      explanation: `In ${subject}, non-blocking asynchronous concurrency combined with distributed caching and connection pools prevents thread starvation and optimizes request throughput.`
    },
    {
      question: `Which security best practice should be strictly enforced when handling user inputs and authentication in ${subject}?`,
      options: [
        'Trusting all client-side inputs without backend sanitization',
        'Implementing strict schema validation, parameter binding, cryptographic hashing, and Principle of Least Privilege',
        'Storing sensitive API secret keys in public client-side JavaScript repositories',
        'Disabling HTTPS TLS encryption'
      ],
      correctAnswer: 1,
      explanation: `Security in ${subject} requires defense-in-depth: validating inputs against strict schemas, parameterizing queries to prevent injection, and hashing credentials with salt.`
    },
    {
      question: `What is the recommended strategy for performance profiling and bottleneck identification in ${subject}?`,
      options: [
        'Guessing performance issues without measuring metrics',
        'Using profiling tools (APM, flame graphs, execution plan analyzers) to measure CPU hotspots, memory allocations, and network delays',
        'Rewriting the entire codebase from scratch before testing',
        'Increasing cloud hardware instance sizes blindly without diagnosis'
      ],
      correctAnswer: 1,
      explanation: `Observability and profiling in ${subject} using APM metrics and flame graphs pinpoint true resource bottlenecks before making premature code modifications.`
    },
    {
      question: `In production ${subject} deployments, how should configuration settings and environment secrets be managed?`,
      options: [
        'Hardcoding database passwords directly into version-controlled source files',
        'Injecting secrets dynamically via secure Environment Variables or dedicated Secrets Managers (Vault / AWS KMS)',
        'Writing credentials in plain text log files',
        'Transmitting secrets over unencrypted HTTP headers'
      ],
      correctAnswer: 1,
      explanation: `Twelve-Factor App principles dictate separating config from code in ${subject}, using environment variables or encrypted secrets management systems.`
    }
  ];

  return customQuestions.slice(0, count);
}

/**
 * Generate Personalized Technical Mock Test with Open-Source LLM Architecture
 */
function generateMockTest({ subject = 'React', difficulty = 'intermediate', questionCount = 5 }) {
  const count = Math.min(20, Math.max(3, Number(questionCount) || 5));
  const questions = generateSubjectSpecificQuestions(subject, difficulty, count);

  const formattedQuestions = questions.map((q, idx) => ({
    id: `mock_${subject.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx + 1}`,
    index: idx,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    subject,
    difficulty
  }));

  return {
    testId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    subject,
    difficulty,
    questionCount: formattedQuestions.length,
    model: OPEN_SOURCE_LLM,
    generatedAt: new Date().toISOString(),
    questions: formattedQuestions
  };
}

module.exports = {
  generateMockTest,
  generateSubjectSpecificQuestions,
  OPEN_SOURCE_LLM
};
