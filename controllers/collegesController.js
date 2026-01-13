const College = require('../models/College');
const User = require('../models/User');

class CollegesController {
  // POST /api/colleges - Create new college (admin only)
  static async createCollege(req, res) {
    try {
      const { name, code, address, contact, type, establishedYear } = req.body;
      
      if (!name || !code || !type) {
        return res.status(400).json({ success: false, error: 'name, code, and type are required' });
      }

      // Generate college ID
      const collegeId = 'COLL_' + Date.now().toString(36).toUpperCase();

      // Handle address - if it's a string, convert to object format
      let addressObj = address;
      if (typeof address === 'string' && address.trim()) {
        // If address is a simple string, store it in the street field
        addressObj = { street: address.trim() };
      } else if (!address || (typeof address === 'object' && Object.keys(address).length === 0)) {
        addressObj = undefined;
      }

      const college = new College({
        collegeId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: addressObj,
        contact,
        type,
        establishedYear
      });

      await college.save();
      return res.status(201).json({ success: true, data: college });
    } catch (err) {
      console.error('createCollege error', err);
      if (err.message && err.message.includes('exists')) return res.status(409).json({ success: false, error: err.message });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // GET /api/colleges - List all colleges (admin only)
  static async listColleges(req, res) {
    try {
      const colleges = await College.find({ isActive: true }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: colleges });
    } catch (err) {
      console.error('listColleges error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // PUT /api/colleges/:id - Update college (admin only)
  static async updateCollege(req, res) {
    try {
      const { id } = req.params;
      const { name, address, contact, type, establishedYear, isActive } = req.body;

      const college = await College.findById(id);
      if (!college) return res.status(404).json({ success: false, error: 'College not found' });

      if (name) college.name = name.trim();
      if (address) college.address = address;
      if (contact) college.contact = contact;
      if (type) college.type = type;
      if (establishedYear) college.establishedYear = establishedYear;
      if (typeof isActive === 'boolean') college.isActive = isActive;

      college.updatedAt = new Date();
      await college.save();

      return res.status(200).json({ success: true, data: college });
    } catch (err) {
      console.error('updateCollege error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // DELETE /api/colleges/:id - Delete college (admin only)
  static async deleteCollege(req, res) {
    try {
      const { id } = req.params;

      // Check if college has users
      const usersCount = await User.countDocuments({ collegeId: id });
      if (usersCount > 0) {
        return res.status(400).json({ success: false, error: 'Cannot delete college with associated users' });
      }

      const college = await College.findById(id);
      if (!college) return res.status(404).json({ success: false, error: 'College not found' });

      await College.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'College deleted successfully' });
    } catch (err) {
      console.error('deleteCollege error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // GET /api/colleges/:id - Get college details (admin only)
  static async getCollege(req, res) {
    try {
      const { id } = req.params;
      const college = await College.findById(id);
      if (!college) return res.status(404).json({ success: false, error: 'College not found' });
      
      // Get user count for this college
      const usersCount = await User.countDocuments({ collegeId: college._id });
      
      return res.status(200).json({ 
        success: true, 
        data: {
          ...college.toObject(),
          usersCount
        }
      });
    } catch (err) {
      console.error('getCollege error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

module.exports = CollegesController;
