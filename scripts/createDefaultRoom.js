/**
 * Script to create default room (room1) if it doesn't exist
 * Usage: node scripts/createDefaultRoom.js
 */

const mongoose = require('mongoose');
const ChatRoom = require('../models/ChatRoom');
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

async function createDefaultRoom() {
  try {
    await connectDB();

    const defaultRoom = {
      roomId: 'room1',
      roomName: 'General Chat',
      roomType: 'group',
      createdBy: 'system',
      description: 'Default public room for all users'
    };

    const room = await ChatRoom.findOneAndUpdate(
      { roomId: 'room1' },
      defaultRoom,
      { upsert: true, new: true }
    );

    console.log(`✅ Default room created/updated: ${room.roomName} (${room.roomId})`);
    console.log('All new users will automatically be added to this room.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating default room:', error);
    process.exit(1);
  }
}

createDefaultRoom();

