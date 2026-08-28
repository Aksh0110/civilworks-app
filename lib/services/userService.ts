import { connectMongoDB } from '../mongodb';
import { User, IUser, UserRole } from '../models/User';
import { hashPassword, verifyPassword } from '../auth/password';
import { logAuditAction } from './auditService';

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  assignedProjectIds?: string[];
  status?: 'ACTIVE' | 'INACTIVE';
  user?: string;
}

/**
 * Ensures at least one Admin user exists in MongoDB.
 * Auto-creates default admin (admin@civilworks.com / Admin@123) if none exists.
 */
export async function ensureAdminUserExists() {
  await connectMongoDB();
  const existingAdmin = await User.findOne({ role: 'ADMIN' }).exec();
  if (!existingAdmin) {
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@civilworks.com';
    const defaultPass = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    const { hash, salt } = hashPassword(defaultPass);

    const admin = await User.create({
      name: 'System Admin',
      email: defaultEmail.toLowerCase(),
      passwordHash: hash,
      salt,
      role: 'ADMIN',
      assignedProjectIds: [],
      status: 'ACTIVE',
      createdBy: 'SYSTEM'
    });

    await logAuditAction({
      user: 'SYSTEM',
      action: 'ADMIN_USER_SEEDED',
      entity: 'User',
      entityId: admin._id.toString(),
      metadata: { email: admin.email, role: admin.role }
    });

    console.log(`[AUTH] Seeded default Admin user: ${admin.email}`);
    return admin;
  }
  return existingAdmin;
}

/**
 * Authenticates user by email and password
 */
export async function authenticateUser(email: string, pass: string) {
  await connectMongoDB();
  await ensureAdminUserExists();

  const userDoc = await User.findOne({ email: email.trim().toLowerCase() }).exec();
  if (!userDoc) {
    throw new Error('Invalid email or password.');
  }

  if (userDoc.status !== 'ACTIVE') {
    throw new Error('Your user account is inactive. Please contact system admin.');
  }

  const isValid = verifyPassword(pass, userDoc.passwordHash, userDoc.salt);
  if (!isValid) {
    throw new Error('Invalid email or password.');
  }

  await logAuditAction({
    user: userDoc.name,
    action: 'USER_LOGIN_SUCCESS',
    entity: 'User',
    entityId: userDoc._id.toString(),
    metadata: { email: userDoc.email, role: userDoc.role }
  });

  return {
    _id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    assignedProjectIds: (userDoc.assignedProjectIds || []).map((id: any) => id.toString()),
    status: userDoc.status
  };
}

/**
 * Gets user by ID
 */
export async function getUserById(id: string) {
  await connectMongoDB();
  const user = await User.findById(id).select('-passwordHash -salt').lean().exec();
  if (!user) return null;
  return JSON.parse(JSON.stringify(user));
}

/**
 * Gets all users under admin supervision
 */
export async function getAllUsers() {
  await connectMongoDB();
  await ensureAdminUserExists();
  const users = await User.find().select('-passwordHash -salt').sort({ createdAt: -1 }).lean().exec();
  return JSON.parse(JSON.stringify(users));
}

/**
 * Creates a new supervised user (Admin only)
 */
export async function createUser(input: CreateUserInput) {
  await connectMongoDB();

  if (!input.name || !input.email || !input.password) {
    throw new Error('Name, email, and password are required.');
  }

  const emailLower = input.email.trim().toLowerCase();
  const existing = await User.findOne({ email: emailLower }).exec();
  if (existing) {
    throw new Error(`User with email "${emailLower}" already exists.`);
  }

  const { hash, salt } = hashPassword(input.password);
  const newUser = await User.create({
    name: input.name.trim(),
    email: emailLower,
    passwordHash: hash,
    salt,
    role: input.role || 'SUPERVISOR',
    assignedProjectIds: input.assignedProjectIds || [],
    status: input.status || 'ACTIVE',
    createdBy: input.user || 'Admin'
  });

  await logAuditAction({
    user: input.user || 'Admin',
    action: 'USER_CREATED',
    entity: 'User',
    entityId: newUser._id.toString(),
    metadata: {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      assignedProjectIds: newUser.assignedProjectIds
    }
  });

  return {
    _id: newUser._id.toString(),
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    assignedProjectIds: (newUser.assignedProjectIds || []).map((id: any) => id.toString()),
    status: newUser.status
  };
}
