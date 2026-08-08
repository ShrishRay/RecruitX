const bcrypt = require('bcryptjs');
const { createModel } = require('../utils/memdb');

/**
 * User Model — Powered by MemDB for zero-setup demo.
 */
const User = createModel('User', {
  preSave: [
    async function () {
      if (!this.password) return;
      // In a real Mongoose app, we'd check isModified. 
      // For MemDB create(), we always hash the password.
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  ],
  methods: {
    async comparePassword(candidatePassword) {
      // 'this' is the document object
      return bcrypt.compare(candidatePassword, this.password);
    }
  }
});

module.exports = User;
