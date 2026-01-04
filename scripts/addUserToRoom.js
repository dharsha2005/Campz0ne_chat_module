/**
 * Script to add a user as a participant to a room
 * Usage: node scripts/addUserToRoom.js <userId> <roomId> [role]
 * Example: node scripts/addUserToRoom.js 3a754c33-85e1-403b-8f22-18e6e8893ae6 room1 member
 */

const mongoose = require('mongoose');
const ChatParticipant = require('../models/ChatParticipant');
const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campzone_chat');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

async function addUserToRoom() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Usage: node scripts/addUserToRoom.js <userId> <roomId> [role]');
      console.log('Example: node scripts/addUserToRoom.js 3a754c33-85e1-403b-8f22-18e6e8893ae6 room1 member');
      process.exit(1);
    }

    const userId = args[0];
    const roomId = args[1];
    const role = args[2] || 'member';

    await connectDB();

    // Check if user exists
    const user = await User.findOne({ userId });
    if (!user) {
      console.error(`❌ User with userId "${userId}" not found`);
      process.exit(1);
    }
    console.log(`✅ Found user: ${user.name} (${user.email})`);

    // Check if room exists
    const room = await ChatRoom.findOne({ roomId });
    if (!room) {
      console.error(`❌ Room with roomId "${roomId}" not found`);
      console.log('\nAvailable rooms:');
      const allRooms = await ChatRoom.find({});
      allRooms.forEach(r => {
        console.log(`  - ${r.roomId}: ${r.roomName} (${r.roomType})`);
      });
      process.exit(1);
    }
    console.log(`✅ Found room: ${room.roomName} (${room.roomType})`);

    // Check if already a participant
    const existing = await ChatParticipant.findOne({ roomId, userId });
    if (existing) {
      console.log(`⚠️  User is already a participant of this room (role: ${existing.role})`);
      console.log(`   Updating role to: ${role}`);
      existing.role = role;
      await existing.save();
      console.log(`✅ Participant updated successfully`);
    } else {
      // Add as participant
      const participant = new ChatParticipant({
        roomId,
        userId,
        role
      });
      await participant.save();
      console.log(`✅ User added as participant with role: ${role}`);
    }

    console.log('\n✅ Success! User can now join and send messages in the room.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addUserToRoom();

