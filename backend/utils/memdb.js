const { v4: uuidv4 } = require('uuid');

/**
 * MemDB — Lightweight in-memory database mimicking Mongoose's API.
 * No MongoDB installation required. Data lives in memory for the session.
 * Perfect for demos and development.
 */

// Global data store — each collection is an array of documents
const collections = {};

/**
 * Generate a MongoDB-style ObjectId (using UUID for simplicity)
 */
function generateId() {
  return uuidv4().replace(/-/g, '').substring(0, 24);
}

/**
 * Deep clone an object to prevent mutation
 */
function clone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Query class — supports chaining .populate(), .sort(), .select()
 */
class Query {
  constructor(docs, collectionName) {
    this._docs = docs;
    this._collectionName = collectionName;
    this._populateRefs = [];
    this._sortBy = null;
    this._selectFields = null;
  }

  populate(refOrObj, selectStr) {
    if (typeof refOrObj === 'string') {
      this._populateRefs.push({ path: refOrObj, select: selectStr || null });
    } else if (typeof refOrObj === 'object' && refOrObj.path) {
      this._populateRefs.push(refOrObj);
    }
    return this;
  }

  sort(sortObj) {
    this._sortBy = sortObj;
    return this;
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  _applyPopulate(docs) {
    for (const ref of this._populateRefs) {
      const { path, select, populate: nestedPop } = ref;

      for (const doc of docs) {
        if (!doc[path]) continue;

        // Find the reference collection by checking model registry
        const refModel = modelRegistry[path] || modelRegistry[path + 's'] || guessModel(path);
        if (!refModel) continue;

        const refId = typeof doc[path] === 'object' ? doc[path]._id || doc[path] : doc[path];
        const refDoc = refModel.findByIdSync(refId);

        if (refDoc) {
          let populated = clone(refDoc);

          // Apply field selection
          if (select) {
            const fields = select.split(' ').filter(f => f);
            const filtered = { _id: populated._id };
            for (const f of fields) {
              if (populated[f] !== undefined) filtered[f] = populated[f];
            }
            populated = filtered;
          }

          // Handle nested populate
          if (nestedPop) {
            const nestedPath = nestedPop.path;
            const nestedSelect = nestedPop.select;
            const nestedModel = modelRegistry[nestedPath] || guessModel(nestedPath);
            if (nestedModel && populated[nestedPath]) {
              const nestedId = typeof populated[nestedPath] === 'object' ? populated[nestedPath]._id || populated[nestedPath] : populated[nestedPath];
              let nestedDoc = nestedModel.findByIdSync(nestedId);
              if (nestedDoc) {
                nestedDoc = clone(nestedDoc);
                if (nestedSelect) {
                  const nFields = nestedSelect.split(' ').filter(f => f);
                  const nFiltered = { _id: nestedDoc._id };
                  for (const f of nFields) {
                    if (nestedDoc[f] !== undefined) nFiltered[f] = nestedDoc[f];
                  }
                  nestedDoc = nFiltered;
                }
                populated[nestedPath] = nestedDoc;
              }
            }
          }

          doc[path] = populated;
        }
      }
    }
    return docs;
  }

  _applySort(docs) {
    if (!this._sortBy) return docs;

    const sortEntries = typeof this._sortBy === 'string'
      ? [[this._sortBy.replace('-', ''), this._sortBy.startsWith('-') ? -1 : 1]]
      : Object.entries(this._sortBy);

    return docs.sort((a, b) => {
      for (const [key, order] of sortEntries) {
        const dir = order === -1 || order === 'desc' ? -1 : 1;
        if (a[key] < b[key]) return -1 * dir;
        if (a[key] > b[key]) return 1 * dir;
      }
      return 0;
    });
  }

  _applySelect(docs) {
    if (!this._selectFields) return docs;
    const fields = this._selectFields.split(' ').filter(f => f);
    const includePassword = fields.includes('+password');

    return docs.map(doc => {
      const d = clone(doc);
      if (includePassword) {
        // Return doc with password included (it's normally excluded)
        return d;
      }
      return d;
    });
  }

  async then(resolve, reject) {
    try {
      let result = clone(this._docs);
      result = this._applySort(result);
      result = this._applyPopulate(result);
      result = this._applySelect(result);
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
    }
  }
}

/**
 * SingleQuery — for findOne/findById results
 */
class SingleQuery {
  constructor(doc, collectionName) {
    this._doc = doc;
    this._collectionName = collectionName;
    this._populateRefs = [];
    this._selectFields = null;
  }

  populate(refOrObj, selectStr) {
    if (typeof refOrObj === 'string') {
      this._populateRefs.push({ path: refOrObj, select: selectStr || null });
    } else if (typeof refOrObj === 'object' && refOrObj.path) {
      this._populateRefs.push(refOrObj);
    }
    return this;
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  sort() { return this; }

  async then(resolve, reject) {
    try {
      if (!this._doc) {
        resolve(null);
        return;
      }

      let doc = clone(this._doc);

      // Include password if requested via select('+password')
      if (this._selectFields && this._selectFields.includes('+password')) {
        // Password is already in the doc, so just return with it
      }

      // Apply populate
      if (this._populateRefs.length > 0) {
        const q = new Query([doc], this._collectionName);
        q._populateRefs = this._populateRefs;
        const populated = q._applyPopulate([doc]);
        doc = populated[0];
      }

      // Add instance methods
      if (this._collectionName && modelInstances[this._collectionName]) {
        const methods = modelInstances[this._collectionName].instanceMethods;
        for (const [name, fn] of Object.entries(methods)) {
          doc[name] = fn.bind(doc);
        }
      }

      resolve(doc);
    } catch (err) {
      if (reject) reject(err);
    }
  }
}

// Model registry for populate lookups
const modelRegistry = {};
const modelInstances = {};

function guessModel(path) {
  // Try common mappings: 'postedBy' -> User, 'candidate' -> User, 'job' -> Job
  const mapping = {
    postedBy: 'User',
    candidate: 'User',
    job: 'Job',
    user: 'User',
  };
  const modelName = mapping[path];
  if (modelName && modelRegistry[modelName]) return modelRegistry[modelName];
  return null;
}

/**
 * Create a Model class for a collection
 */
function createModel(name, schema = {}) {
  const collectionName = name.toLowerCase() + 's';

  if (!collections[collectionName]) {
    collections[collectionName] = [];
  }

  const instanceMethods = schema.methods || {};
  const preSaveHooks = schema.preSave || [];

  const Model = {
    modelName: name,
    collectionName,
    instanceMethods,

    /**
     * Create one or more documents
     */
    async create(data) {
      const isArray = Array.isArray(data);
      const items = isArray ? data : [data];
      const results = [];

      for (const item of items) {
        const doc = {
          _id: generateId(),
          ...clone(item),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Run pre-save hooks
        for (const hook of preSaveHooks) {
          await hook.call(doc);
        }

        collections[collectionName].push(doc);
        const result = clone(doc);

        // Attach instance methods
        for (const [mName, fn] of Object.entries(instanceMethods)) {
          result[mName] = fn.bind(result);
        }

        results.push(result);
      }

      return isArray ? results : results[0];
    },

    /**
     * Find documents matching a query
     */
    find(query = {}) {
      let docs = collections[collectionName].filter(doc => matchesQuery(doc, query));
      return new Query(docs, collectionName);
    },

    /**
     * Find a single document
     */
    findOne(query = {}) {
      const doc = collections[collectionName].find(doc => matchesQuery(doc, query));
      return new SingleQuery(doc || null, collectionName);
    },

    /**
     * Synchronous findById (for internal use)
     */
    findByIdSync(id) {
      if (!id) return null;
      const idStr = typeof id === 'object' ? id._id || id.toString() : id.toString();
      return collections[collectionName].find(d => d._id === idStr) || null;
    },

    /**
     * Find by ID
     */
    findById(id) {
      const idStr = typeof id === 'object' ? id._id || id.toString() : id?.toString();
      const doc = collections[collectionName].find(d => d._id === idStr);
      return new SingleQuery(doc || null, collectionName);
    },

    /**
     * Find by ID and update
     */
    async findByIdAndUpdate(id, updates, options = {}) {
      const idStr = typeof id === 'object' ? id._id || id.toString() : id?.toString();
      const idx = collections[collectionName].findIndex(d => d._id === idStr);
      if (idx === -1) return null;

      // Apply updates
      Object.assign(collections[collectionName][idx], clone(updates), { updatedAt: new Date().toISOString() });

      const result = clone(collections[collectionName][idx]);
      for (const [mName, fn] of Object.entries(instanceMethods)) {
        result[mName] = fn.bind(result);
      }
      return result;
    },

    /**
     * Find by ID and delete
     */
    async findByIdAndDelete(id) {
      const idStr = typeof id === 'object' ? id._id || id.toString() : id?.toString();
      const idx = collections[collectionName].findIndex(d => d._id === idStr);
      if (idx === -1) return null;
      const deleted = collections[collectionName].splice(idx, 1)[0];
      return clone(deleted);
    },

    /**
     * Count documents matching a query
     */
    async countDocuments(query = {}) {
      return collections[collectionName].filter(doc => matchesQuery(doc, query)).length;
    },
  };

  // Register model for populate lookups
  modelRegistry[name] = Model;
  modelInstances[collectionName] = { instanceMethods };

  return Model;
}

/**
 * Check if a document matches a query object
 */
function matchesQuery(doc, query) {
  for (const [key, value] of Object.entries(query)) {
    const docVal = doc[key];
    const queryVal = typeof value === 'object' && value !== null && value._id ? value._id : value;
    const docValStr = typeof docVal === 'object' && docVal !== null && docVal._id ? docVal._id : docVal;

    if (String(docValStr) !== String(queryVal)) return false;
  }
  return true;
}

module.exports = { createModel, generateId, collections };
