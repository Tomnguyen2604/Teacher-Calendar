import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Hash password
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Compare password
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get user from context
export function getUserFromContext(context) {
  return context.user || null;
}

// Require authentication
export function requireAuth(user) {
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Require admin role
export function requireAdmin(user) {
  requireAuth(user);
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}
