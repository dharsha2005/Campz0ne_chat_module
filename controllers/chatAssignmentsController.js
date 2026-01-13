const ChatAssignment = require('../models/ChatAssignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const ChatRoom = require('../models/ChatRoom');
const participantService = require('../services/participantService');
const socketService = require('../services/socketService');

class ChatAssignmentsController {
  // POST /api/chats/:chatRoomId/assignments
  static async createAssignment(req, res) {
    try {
      const { chatRoomId } = req.params;
      const { title, description, dueDate } = req.body;

      if (!title) return res.status(400).json({ success: false, error: 'title is required' });

      // Verify room
      const room = await ChatRoom.findOne({ roomId: chatRoomId });
      if (!room) return res.status(404).json({ success: false, error: 'Chat room not found' });

      // Ensure participant
      await participantService.ensureUserIsParticipant(req.user.userId, chatRoomId);

      // Only faculty/admin can create assignments
      if (!['faculty', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Only faculty or admins can create assignments' });
      }

      const assignment = new ChatAssignment({
        chatRoomId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdBy: req.user.userId
      });

      await assignment.save();

      socketService.emitToRoom(chatRoomId, 'assignment_created', {
        assignmentId: assignment._id,
        chatRoomId,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        createdBy: assignment.createdBy,
        createdAt: assignment.createdAt
      });

      socketService.emitToRoom(chatRoomId, 'notification', {
        type: 'assignment_created',
        chatRoomId,
        assignmentId: assignment._id,
        title: assignment.title,
        message: `${req.user.name || req.user.userId} created assignment: ${assignment.title}`
      });

      return res.status(201).json({ success: true, data: assignment });
    } catch (err) {
      console.error('createAssignment error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // GET /api/chats/:chatRoomId/assignments
  static async listAssignments(req, res) {
    try {
      const { chatRoomId } = req.params;

      // Ensure participant
      await participantService.ensureUserIsParticipant(req.user.userId, chatRoomId);

      const assignments = await ChatAssignment.find({ chatRoomId }).sort({ createdAt: -1 });
      
      // For students, include their submission status
      if (req.user.role === 'student') {
        const assignmentsWithStatus = await Promise.all(
          assignments.map(async (assignment) => {
            const submission = await AssignmentSubmission.findOne({
              assignmentId: assignment._id,
              studentId: req.user.userId
            });
            return {
              ...assignment.toObject(),
              submissionStatus: submission ? 'submitted' : 'pending',
              submission: submission || null
            };
          })
        );
        return res.status(200).json({ success: true, data: assignmentsWithStatus });
      }

      // For faculty/admin, return assignments as-is
      return res.status(200).json({ success: true, data: assignments });
    } catch (err) {
      console.error('listAssignments error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // GET /api/assignments/:assignmentId/submissions (faculty only)
  static async getSubmissions(req, res) {
    try {
      const { assignmentId } = req.params;

      // Only faculty/admin can view submissions
      if (!['faculty', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Only faculty or admins can view submissions' });
      }

      const assignment = await ChatAssignment.findById(assignmentId);
      if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });

      // Ensure participant in assignment's chat room
      await participantService.ensureUserIsParticipant(req.user.userId, assignment.chatRoomId);

      const submissions = await AssignmentSubmission.find({ assignmentId: assignment._id })
        .sort({ submittedAt: -1 });

      return res.status(200).json({ 
        success: true, 
        data: {
          assignment,
          submissions
        }
      });
    } catch (err) {
      console.error('getSubmissions error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // PUT /api/assignments/:assignmentId/submissions/:submissionId/grade (faculty only)
  static async gradeSubmission(req, res) {
    try {
      const { assignmentId, submissionId } = req.params;
      const { marks } = req.body;

      // Only faculty/admin can grade
      if (!['faculty', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Only faculty or admins can grade submissions' });
      }

      const assignment = await ChatAssignment.findById(assignmentId);
      if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });

      // Ensure participant in assignment's chat room
      await participantService.ensureUserIsParticipant(req.user.userId, assignment.chatRoomId);

      const submission = await AssignmentSubmission.findOne({ 
        _id: submissionId, 
        assignmentId: assignment._id 
      });
      if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });

      if (marks !== undefined) {
        submission.marks = marks;
        await submission.save();
      }

      // Emit update event
      socketService.emitToRoom(assignment.chatRoomId, 'submission_graded', {
        assignmentId: assignment._id,
        submissionId: submission._id,
        studentId: submission.studentId,
        marks: submission.marks
      });

      return res.status(200).json({ success: true, data: submission });
    } catch (err) {
      console.error('gradeSubmission error', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // POST /api/assignments/:assignmentId/submit
  static async submitAssignment(req, res) {
    try {
      const { assignmentId } = req.params;
      const { fileUrl } = req.body;

      if (!fileUrl) return res.status(400).json({ success: false, error: 'fileUrl is required for submission' });

      const assignment = await ChatAssignment.findById(assignmentId);
      if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });

      // Check participant in assignment's chat room
      await participantService.ensureUserIsParticipant(req.user.userId, assignment.chatRoomId);

      // Students only (or faculty/admin could submit but typically students)
      if (req.user.role === 'faculty' && req.user.role !== 'admin') {
        // allow faculty/admin if desired; but primary flow is student
      }

      // Check due date if present
      if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
        return res.status(400).json({ success: false, error: 'Assignment due date has passed' });
      }

      // Upsert submission (one submission per student enforced by unique index)
      let submission = await AssignmentSubmission.findOne({ assignmentId: assignment._id, studentId: req.user.userId });
      if (submission) {
        submission.fileUrl = fileUrl;
        submission.submittedAt = new Date();
        await submission.save();
      } else {
        submission = new AssignmentSubmission({ assignmentId: assignment._id, studentId: req.user.userId, fileUrl });
        await submission.save();
      }

      // Emit room-scoped event
      socketService.emitToRoom(assignment.chatRoomId, 'assignment_submitted', {
        assignmentId: assignment._id,
        submissionId: submission._id,
        studentId: submission.studentId,
        submittedAt: submission.submittedAt
      });

      socketService.emitToRoom(assignment.chatRoomId, 'notification', {
        type: 'assignment_submitted',
        chatRoomId: assignment.chatRoomId,
        assignmentId: assignment._id,
        submissionId: submission._id,
        message: `${req.user.name || req.user.userId} submitted assignment: ${assignment.title}`
      });

      return res.status(200).json({ success: true, data: submission });
    } catch (err) {
      console.error('submitAssignment error', err);
      if (err.code === 11000) {
        return res.status(409).json({ success: false, error: 'Submission already exists' });
      }
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

module.exports = ChatAssignmentsController;
