# Materials and Assignments Implementation

## Overview
This document describes the implementation of Materials and Assignments functionality in the CampZone Chat Module, similar to Google Classroom. The functionality is chat-scoped, meaning each group chat acts as a classroom where materials and assignments are shared.

## Backend Implementation

### Models
All models are already defined in the `models/` directory:
- **ChatMaterial**: Stores materials posted to a chat room
- **ChatAssignment**: Stores assignments created in a chat room
- **AssignmentSubmission**: Stores student submissions for assignments

### Controllers

#### ChatMaterialsController (`controllers/chatMaterialsController.js`)
- `createMaterial`: POST `/api/chats/:chatRoomId/materials`
  - Faculty/Admin only
  - Requires participant verification
  - Emits `material_posted` and `notification` Socket.IO events
  
- `listMaterials`: GET `/api/chats/:chatRoomId/materials`
  - All participants can view
  - Returns materials sorted by creation date (newest first)

#### ChatAssignmentsController (`controllers/chatAssignmentsController.js`)
- `createAssignment`: POST `/api/chats/:chatRoomId/assignments`
  - Faculty/Admin only
  - Requires participant verification
  - Emits `assignment_created` and `notification` Socket.IO events

- `listAssignments`: GET `/api/chats/:chatRoomId/assignments`
  - All participants can view
  - For students: includes submission status (submitted/pending)
  - For faculty: returns assignments as-is

- `submitAssignment`: POST `/api/assignments/:assignmentId/submit`
  - Students can submit assignments
  - Validates due date
  - Allows resubmission (updates existing submission)
  - Emits `assignment_submitted` and `notification` Socket.IO events

- `getSubmissions`: GET `/api/assignments/:assignmentId/submissions`
  - Faculty/Admin only
  - Returns all submissions for an assignment

- `gradeSubmission`: PUT `/api/assignments/:assignmentId/submissions/:submissionId/grade`
  - Faculty/Admin only
  - Allows grading submissions with marks
  - Emits `submission_graded` Socket.IO event

### Routes

#### `/api/chats/:chatRoomId/materials`
- POST: Create material (faculty/admin)
- GET: List materials (all participants)

#### `/api/chats/:chatRoomId/assignments`
- POST: Create assignment (faculty/admin)
- GET: List assignments (all participants, with submission status for students)

#### `/api/assignments/:assignmentId/submit`
- POST: Submit assignment (students)

#### `/api/assignments/:assignmentId/submissions`
- GET: View submissions (faculty/admin)

#### `/api/assignments/:assignmentId/submissions/:submissionId/grade`
- PUT: Grade submission (faculty/admin)

### Security & Access Control

1. **JWT Authentication**: All endpoints require valid JWT token via `authenticateToken` middleware
2. **Participant Verification**: All chat-scoped endpoints verify user is a participant via `ensureParticipant` middleware
3. **Role-Based Access**:
   - Faculty/Admin: Can create materials and assignments, view submissions, grade
   - Students: Can view materials, view assignments, submit assignments

### Socket.IO Events

#### Server → Client Events
- `material_posted`: Emitted when a material is posted to a chat room
- `assignment_created`: Emitted when an assignment is created
- `assignment_submitted`: Emitted when a student submits an assignment
- `submission_graded`: Emitted when faculty grades a submission
- `notification`: General notification event for all actions

All events are scoped to the specific chat room using `socketService.emitToRoom()`.

## Frontend Implementation

### UI Structure

The UI includes three tabs:
1. **Messages**: Chat interface (existing)
2. **Materials**: View and post materials
3. **Assignments**: View, create, submit, and grade assignments

### Materials Tab

**For All Users:**
- Displays list of materials with:
  - Title
  - Description
  - File link (if provided)
  - Uploader and upload date

**For Faculty/Admin:**
- "Post Material" form with:
  - Title (required)
  - Description (optional)
  - File URL (optional)

### Assignments Tab

**For Students:**
- Displays assignments with:
  - Title and description
  - Due date (with overdue indicator)
  - Submission status badge (Submitted/Pending/Overdue)
  - Submission date and grade (if submitted)
  - Submit/Resubmit button

**For Faculty/Admin:**
- "Create Assignment" form with:
  - Title (required)
  - Description (optional)
  - Due date (optional)
- "View Submissions" button for each assignment
- Submission list showing:
  - Student ID
  - Submission date
  - File link
  - Grade input field with save button

### Real-time Updates

The UI listens to Socket.IO events and automatically updates:
- When a material is posted → refreshes materials list
- When an assignment is created → refreshes assignments list
- When an assignment is submitted → refreshes assignments list
- When a submission is graded → refreshes submissions view

### Key JavaScript Functions

- `showTab(tab)`: Switches between Messages/Materials/Assignments tabs
- `fetchMaterials()`: Loads materials for current chat room
- `postMaterial()`: Posts a new material (faculty/admin)
- `fetchAssignments()`: Loads assignments with submission status
- `createAssignment()`: Creates a new assignment (faculty/admin)
- `submitAssignment(assignmentId)`: Submits an assignment (students)
- `viewSubmissions(assignmentId)`: Views all submissions for an assignment (faculty/admin)
- `gradeSubmission(assignmentId, submissionId)`: Grades a submission (faculty/admin)

## Data Flow

### Creating a Material
```
Faculty → POST /api/chats/:chatRoomId/materials
  → Backend validates (JWT, participant, role)
  → Creates ChatMaterial document
  → Emits material_posted to chat room
  → All participants in room receive event
  → UI refreshes materials list
```

### Creating an Assignment
```
Faculty → POST /api/chats/:chatRoomId/assignments
  → Backend validates (JWT, participant, role)
  → Creates ChatAssignment document
  → Emits assignment_created to chat room
  → All participants receive event
  → UI refreshes assignments list
```

### Submitting an Assignment
```
Student → POST /api/assignments/:assignmentId/submit
  → Backend validates (JWT, participant, due date)
  → Creates/updates AssignmentSubmission
  → Emits assignment_submitted to chat room
  → All participants receive event
  → UI refreshes assignments list (shows submitted status)
```

### Viewing Submissions (Faculty)
```
Faculty → GET /api/assignments/:assignmentId/submissions
  → Backend validates (JWT, participant, role)
  → Returns assignment and all submissions
  → UI displays submission list with grade inputs
```

### Grading a Submission
```
Faculty → PUT /api/assignments/:assignmentId/submissions/:submissionId/grade
  → Backend validates (JWT, participant, role)
  → Updates submission marks
  → Emits submission_graded to chat room
  → UI refreshes submissions view
```

## Features

✅ Chat-scoped materials and assignments  
✅ Role-based access control (faculty vs student)  
✅ Participant verification on all endpoints  
✅ Real-time updates via Socket.IO  
✅ Submission status tracking for students  
✅ Assignment grading for faculty  
✅ Due date validation  
✅ Overdue assignment indicators  
✅ Resubmission support  
✅ Clean, modern UI with proper styling  

## Testing

To test the implementation:

1. **Create users with different roles:**
   - Faculty user (role: 'faculty')
   - Student user (role: 'student')

2. **Login as faculty:**
   - Create a chat room
   - Post materials
   - Create assignments
   - View and grade submissions

3. **Login as student:**
   - Join the chat room
   - View materials
   - View assignments
   - Submit assignments
   - Check submission status

4. **Test real-time updates:**
   - Open two browser windows
   - Login as different users
   - Post materials/assignments in one window
   - Verify updates appear in the other window

## Notes

- File uploads are handled via URL (fileUrl field). For production, you may want to implement actual file upload functionality.
- The UI uses simple HTML/CSS/JavaScript (no framework) as requested.
- All data is scoped to chat rooms - materials and assignments are only visible to room participants.
- Socket.IO events ensure real-time updates across all connected clients in the same room.

