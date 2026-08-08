const User = require('../models/User');

/**
 * GET /api/candidate/profile
 * Get the authenticated candidate's full profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'candidate') {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    res.json({ profile: user });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

/**
 * PUT /api/candidate/profile
 * Update the authenticated candidate's profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'skills', 'experience', 'projects',
      'education', 'preferredRole', 'preferredLocation'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    res.json({ profile: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};
