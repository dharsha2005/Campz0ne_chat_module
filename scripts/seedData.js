/**
 * Seed Script
 * Creates sample data for testing the chat module
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const ChatParticipant = require('../models/ChatParticipant');
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

async function seedData() {
  try {
    await connectDB();

    // Clear existing data (optional)
    // await User.deleteMany({});
    // await ChatRoom.deleteMany({});
    // await ChatParticipant.deleteMany({});

    // Create users
    const users = [
      { userId: 'user1', username: 'Alice', email: 'alice@example.com' },
      { userId: 'user2', username: 'Bob', email: 'bob@example.com' },
      { userId: 'user3', username: 'Charlie', email: 'charlie@example.com' }
    ];

    for (const userData of users) {
      await User.findOneAndUpdate(
        { userId: userData.userId },
        userData,
        { upsert: true, new: true }
      );
      console.log(`Created/Updated user: ${userData.userId}`);
    }

    // Create rooms
    const rooms = [
      {
        roomId: 'room1',
        roomName: 'General Chat',
        roomType: 'group',
        createdBy: 'user1',
        description: 'General discussion room'
      },
      {
        roomId: 'room2',
        roomName: 'Tech Discussion',
        roomType: 'group',
        createdBy: 'user1',
        description: 'Technology discussion room'
      },
      {
        roomId: 'room3',
        roomName: 'Alice & Bob',
        roomType: 'one-to-one',
        createdBy: 'user1',
        description: 'Private chat between Alice and Bob'
      }
    ];

    for (const roomData of rooms) {
      await ChatRoom.findOneAndUpdate(
        { roomId: roomData.roomId },
        roomData,
        { upsert: true, new: true }
      );
      console.log(`Created/Updated room: ${roomData.roomId}`);
    }

    // Create participants
    const participants = [
      // Room 1: All users
      { roomId: 'room1', userId: 'user1', role: 'admin' },
      { roomId: 'room1', userId: 'user2', role: 'member' },
      { roomId: 'room1', userId: 'user3', role: 'member' },
      
      // Room 2: User1 and User2
      { roomId: 'room2', userId: 'user1', role: 'admin' },
      { roomId: 'room2', userId: 'user2', role: 'member' },
      { roomId: 'room2', userId: 'user3', role: 'member' },
      
      // Room 3: One-to-one (User1 and User2)
      { roomId: 'room3', userId: 'user1', role: 'member' },
      { roomId: 'room3', userId: 'user2', role: 'member' }
    ];

    for (const participantData of participants) {
      await ChatParticipant.findOneAndUpdate(
        { roomId: participantData.roomId, userId: participantData.userId },
        participantData,
        { upsert: true, new: true }
      );
      console.log(`Created/Updated participant: ${participantData.userId} in ${participantData.roomId}`);
    }

    console.log('\n✅ Seed data created successfully!');
    console.log('\nYou can now test with:');
    console.log('- User1: user1');
    console.log('- User2: user2');
    console.log('- User3: user3');
    console.log('\nRooms available:');
    console.log('- room1 (General Chat)');
    console.log('- room2 (Tech Discussion)');
    console.log('- room3 (Alice & Bob - one-to-one)');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();

