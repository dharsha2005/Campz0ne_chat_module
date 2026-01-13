const Subject = require('../models/Subject');
const College = require('../models/College');
const User = require('../models/User');
const { parseRoll, compareRoll } = require('../services/rollUtils');

class SubjectsController {
  // POST /api/subjects
  static async createSubject(req, res) {
    try {
      const { name, code, collegeId: bodyCollegeId, departmentId: bodyDepartmentId, classroomId, rollStart, rollEnd, description, credits } = req.body;
      if (!name || !classroomId || !rollStart || !rollEnd) {
        return res.status(400).json({ success: false, error: 'name, classroomId, rollStart and rollEnd required' });
      }

      // Only faculty or admin can create. Controller route will ensure role, but double-check.
      if (!['faculty','admin'].includes(req.user.role)) return res.status(403).json({ success: false, error: 'Only faculty or admin can create subjects' });

      // Determine collegeId and departmentId. For faculty, infer from their profile; for admin, require in body.
      let collegeId = bodyCollegeId;
      let departmentId = bodyDepartmentId;
      if (req.user.role === 'faculty') {
        const faculty = await User.findOne({ userId: req.user.userId });
        if (!faculty) return res.status(401).json({ success: false, error: 'Faculty not found' });
        if (!faculty.collegeId) return res.status(403).json({ success: false, error: 'Faculty has no college assigned' });
        collegeId = String(faculty.collegeId);
        departmentId = String(faculty.departmentId);
      } else {
        if (!collegeId || !departmentId) {
          return res.status(400).json({ success: false, error: 'collegeId and departmentId are required for admin' });
        }
      }

      // Verify college exists
      const college = await College.findById(collegeId);
      if (!college) return res.status(404).json({ success: false, error: 'College not found' });

      // Validate roll formats
      if (!parseRoll(rollStart) || !parseRoll(rollEnd)) return res.status(400).json({ success: false, error: 'Invalid rollStart/rollEnd format' });
      if (compareRoll(rollStart, rollEnd) > 0) return res.status(400).json({ success: false, error: 'rollStart must be <= rollEnd' });

      const subject = new Subject({
        facultyId: req.user.userId,
        collegeId: String(collegeId),
        departmentId: String(departmentId),
        classroomId: String(classroomId),
        name: name.trim(),
        code: code ? code.trim().toUpperCase() : name.trim().toUpperCase().replace(/\s+/g, '_'),
        rollStart: rollStart.trim().toUpperCase(),
        rollEnd: rollEnd.trim().toUpperCase(),
        description: description ? description.trim() : undefined,
        credits: credits || 3
      });
      await subject.save();
      return res.status(201).json({ success: true, data: subject });
    } catch (err) {
      console.error('createSubject error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // GET /api/subjects/my
  static async mySubjects(req, res) {
    try {
      if (!['faculty','admin'].includes(req.user.role)) return res.status(403).json({ success: false, error: 'Only faculty or admin can list their subjects' });
      
      let subjects;
      if (req.user.role === 'admin') {
        subjects = await Subject.find({}).sort({ createdAt: -1 });
      } else {
        const faculty = await User.findOne({ userId: req.user.userId });
        subjects = await Subject.find({ 
          facultyId: req.user.userId,
          collegeId: faculty.collegeId 
        }).sort({ createdAt: -1 });
      }
      
      return res.status(200).json({ success: true, data: subjects });
    } catch (err) {
      console.error('mySubjects error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // GET /api/subjects/college/:collegeId - Get subjects by college (admin only)
  static async getSubjectsByCollege(req, res) {
    try {
      const { collegeId } = req.params;
      const subjects = await Subject.find({ collegeId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: subjects });
    } catch (err) {
      console.error('getSubjectsByCollege error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // GET /api/subjects/classroom/:classroomId - Get subjects by classroom
  static async getSubjectsByClassroom(req, res) {
    try {
      const { classroomId } = req.params;
      const subjects = await Subject.find({ classroomId, isActive: true }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: subjects });
    } catch (err) {
      console.error('getSubjectsByClassroom error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

module.exports = SubjectsController;
