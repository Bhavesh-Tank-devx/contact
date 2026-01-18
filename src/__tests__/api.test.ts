import { describe, it, expect, beforeAll } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import Contact from '@/models/Contact';
import connectDB from '@/lib/db';
import { signToken, verifyToken } from '@/lib/jwt';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Setup in-memory MongoDB for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  process.env.MONGODB_URI = mongoUri;
  await connectDB();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('User Model', () => {
  it('should create a new user with hashed password', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'member',
    });

    expect(user).toBeDefined();
    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('member');
    expect(user.password).not.toBe('password123');
  });

  it('should not allow duplicate email', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await User.create({
      username: 'user1',
      email: 'duplicate@example.com',
      password: hashedPassword,
    });

    await expect(
      User.create({
        username: 'user2',
        email: 'duplicate@example.com',
        password: hashedPassword,
      })
    ).rejects.toThrow();
  });
});

describe('Contact Model', () => {
  it('should create a contact with owner reference', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
    });

    const contact = await Contact.create({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      age: 30,
      owner: user._id,
    });

    expect(contact).toBeDefined();
    expect(contact.name).toBe('John Doe');
    expect(contact.owner.toString()).toBe(user._id.toString());
  });

  it('should require only name and phone', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
    });

    // Should work with only required fields
    const contact = await Contact.create({
      name: 'John Doe',
      phone: '1234567890',
      owner: user._id,
    });

    expect(contact).toBeDefined();
    expect(contact.name).toBe('John Doe');
    expect(contact.phone).toBe('1234567890');
    expect(contact.email).toBeUndefined();
    expect(contact.age).toBeUndefined();
  });

  it('should support profileImage field', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      username: 'testuser2',
      email: 'test2@example.com',
      password: hashedPassword,
    });

    const contact = await Contact.create({
      name: 'Jane Doe',
      phone: '9876543210',
      profileImage: 'https://example.com/profile.jpg',
      owner: user._id,
    });

    expect(contact.profileImage).toBe('https://example.com/profile.jpg');
  });
});


describe('JWT Utilities', () => {
  it('should sign and verify tokens correctly', () => {
    const payload = {
      userId: '123',
      email: 'test@example.com',
      role: 'member',
    };

    const token = signToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(payload.role);
  });

  it('should return null for invalid token', () => {
    const decoded = verifyToken('invalid-token');
    expect(decoded).toBeNull();
  });
});

describe('Authentication Flow', () => {
  it('should register, login, and verify user', async () => {
    // Register
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      username: 'authuser',
      email: 'auth@example.com',
      password: hashedPassword,
      role: 'member',
    });

    expect(user).toBeDefined();

    // Login simulation
    const foundUser = await User.findOne({ email: 'auth@example.com' });
    expect(foundUser).toBeDefined();

    const isPasswordValid = await bcrypt.compare('password123', foundUser!.password);
    expect(isPasswordValid).toBe(true);

    // Generate token
    const token = signToken({
      userId: foundUser!._id.toString(),
      email: foundUser!.email,
      role: foundUser!.role,
    });

    // Verify token
    const decoded = verifyToken(token);
    expect(decoded?.userId).toBe(foundUser!._id.toString());
  });
});

describe('Contact CRUD Operations', () => {
  let userId: string;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      username: 'contactuser',
      email: 'contact@example.com',
      password: hashedPassword,
    });
    userId = user._id.toString();
  });

  it('should create and list contacts for a user', async () => {
    // Create contacts
    await Contact.create({
      name: 'Contact 1',
      email: 'contact1@example.com',
      phone: '1111111111',
      age: 25,
      owner: userId,
    });

    await Contact.create({
      name: 'Contact 2',
      email: 'contact2@example.com',
      phone: '2222222222',
      age: 30,
      owner: userId,
    });

    // List contacts
    const contacts = await Contact.find({ owner: userId });
    expect(contacts).toHaveLength(2);
  });

  it('should update a contact', async () => {
    const contact = await Contact.create({
      name: 'Old Name',
      email: 'old@example.com',
      phone: '1111111111',
      age: 25,
      owner: userId,
    });

    const updated = await Contact.findOneAndUpdate(
      { _id: contact._id, owner: userId },
      { name: 'New Name', age: 26 },
      { new: true }
    );

    expect(updated?.name).toBe('New Name');
    expect(updated?.age).toBe(26);
  });

  it('should delete a contact', async () => {
    const contact = await Contact.create({
      name: 'To Delete',
      email: 'delete@example.com',
      phone: '1111111111',
      age: 25,
      owner: userId,
    });

    const deleted = await Contact.findOneAndDelete({
      _id: contact._id,
      owner: userId,
    });

    expect(deleted).toBeDefined();

    const found = await Contact.findById(contact._id);
    expect(found).toBeNull();
  });

  it('should not allow access to other users contacts', async () => {
    // Create another user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: hashedPassword,
    });

    // Create contact for first user
    const contact = await Contact.create({
      name: 'Private Contact',
      email: 'private@example.com',
      phone: '1111111111',
      age: 25,
      owner: userId,
    });

    // Try to access with other user
    const found = await Contact.findOne({
      _id: contact._id,
      owner: otherUser._id,
    });

    expect(found).toBeNull();
  });
});
