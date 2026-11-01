import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export const bootstrapAdmin = async () => {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  console.log('\n======================================================');
  console.log('   SmartTravel — Secure Admin Bootstrap Utility');
  console.log('======================================================\n');

  const conn = await connectDB();
  if (!conn) {
    console.error('[Bootstrap Error] Database connection failed.');
    process.exit(1);
  }

  try {
    // 1. Status Command
    if (command === 'status' || !command) {
      const admins = await User.find({ role: 'admin' }).select('name email role isActive createdAt');
      console.log(`[Status] Total Administrators Configured: ${admins.length}`);
      if (admins.length > 0) {
        admins.forEach((adm, idx) => {
          console.log(`  ${idx + 1}. ${adm.name} (${adm.email}) — Active: ${adm.isActive} [Created: ${adm.createdAt.toISOString()}]`);
        });
      } else {
        console.log('  Notice: No administrative accounts currently exist in the database.');
        console.log('  To promote an account: node server/scripts/bootstrapAdmin.js promote <email>');
        console.log('  To create an account:  node server/scripts/bootstrapAdmin.js create <email> <name> <password>');
      }
      return;
    }

    // 2. Promote Existing User
    if (command === 'promote') {
      const email = args[1]?.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        console.error('[Error] Please provide a valid email address to promote.');
        console.log('Usage: node server/scripts/bootstrapAdmin.js promote <email>');
        process.exit(1);
      }

      const user = await User.findOne({ email });
      if (!user) {
        console.error(`[Error] No user found with email "${email}". Register the account first, then promote.`);
        process.exit(1);
      }

      if (user.role === 'admin') {
        console.log(`[Notice] User "${user.name}" (${user.email}) already has the "admin" role.`);
        return;
      }

      user.role = 'admin';
      user.isActive = true;
      await user.save();

      await AuditLog.create({
        action: 'USER_ROLE_CHANGE',
        adminId: user._id,
        adminEmail: user.email,
        adminName: user.name,
        targetType: 'User',
        targetId: user._id.toString(),
        targetName: user.name,
        summary: `Account promoted to administrator via server bootstrap utility.`,
        metadata: { previousRole: 'user', newRole: 'admin', method: 'CLI bootstrap' },
      });

      console.log(`[Success] User "${user.name}" (${user.email}) successfully promoted to ADMINISTRATOR.`);
      return;
    }

    // 3. Create New Admin Account
    if (command === 'create') {
      const email = args[1]?.trim().toLowerCase();
      const name = args[2]?.trim();
      const password = args[3];

      if (!email || !email.includes('@') || !name || !password) {
        console.error('[Error] Incomplete arguments for admin creation.');
        console.log('Usage: node server/scripts/bootstrapAdmin.js create <email> <name> <password>');
        process.exit(1);
      }

      if (password.length < 8) {
        console.error('[Error] Admin password must be at least 8 characters long.');
        process.exit(1);
      }

      const existing = await User.findOne({ email });
      if (existing) {
        console.error(`[Error] An account with email "${email}" already exists. Use "promote" instead.`);
        process.exit(1);
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const newAdmin = await User.create({
        name,
        email,
        passwordHash,
        role: 'admin',
        isActive: true,
      });

      await AuditLog.create({
        action: 'USER_ROLE_CHANGE',
        adminId: newAdmin._id,
        adminEmail: newAdmin.email,
        adminName: newAdmin.name,
        targetType: 'User',
        targetId: newAdmin._id.toString(),
        targetName: newAdmin.name,
        summary: `New administrator account created via server bootstrap utility.`,
        metadata: { role: 'admin', method: 'CLI bootstrap create' },
      });

      console.log(`[Success] New Administrator "${name}" (${email}) created successfully.`);
      return;
    }

    // 4. Automatic promotion from ADMIN_INITIAL_EMAIL
    if (command === 'env-check') {
      const envEmail = process.env.ADMIN_INITIAL_EMAIL?.trim().toLowerCase();
      if (!envEmail) {
        console.log('[Notice] ADMIN_INITIAL_EMAIL is not set in environment.');
        return;
      }

      const user = await User.findOne({ email: envEmail });
      if (user && user.role !== 'admin') {
        user.role = 'admin';
        user.isActive = true;
        await user.save();
        console.log(`[Success] Promoted initial admin from environment: ${user.email}`);
      }
      return;
    }

    console.log('[Notice] Unknown command. Available: status, promote <email>, create <email> <name> <password>');
  } catch (err) {
    console.error('[Bootstrap Failure]', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n[Bootstrap] Database connection closed.');
  }
};

if (process.argv[1] && process.argv[1].endsWith('bootstrapAdmin.js')) {
  bootstrapAdmin();
}
