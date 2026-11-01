import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure environment variables are loaded regardless of import order
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Diagnostic state tracking
let lastDiagnostic = {
  reason: 'Not attempted yet',
  message: 'Database connection has not been initialized.',
  timestamp: null,
};

// Mask credentials in MongoDB connection string for safe logging
export const maskMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return 'undefined';
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:*****@');
  } catch {
    return 'masked_uri';
  }
};

// Sanitize connection string from common mistakes without altering credentials
export const sanitizeMongoUri = (rawUri) => {
  if (!rawUri || typeof rawUri !== 'string') return '';
  let uri = rawUri.trim();

  // Strip duplicate variable name prefix if copied by mistake (e.g. MONGODB_URI=mongodb+srv://...)
  if (uri.startsWith('MONGODB_URI=')) {
    uri = uri.replace(/^MONGODB_URI=/, '').trim();
  }

  // Strip surrounding quotes
  uri = uri.replace(/^["']|["']$/g, '').trim();

  return uri;
};

let listenersAttached = false;

const attachEventListeners = () => {
  if (listenersAttached) return;

  mongoose.connection.on('connected', () => {
    lastDiagnostic = {
      reason: 'Connected',
      message: 'MongoDB database connection is active and responsive.',
      timestamp: new Date().toISOString(),
    };
    console.log('[Database] MongoDB connection state: connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database] MongoDB runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB connection state: disconnected');
  });

  listenersAttached = true;
};

// Safe diagnostic analyzer that produces zero-credential actionable guidance
const diagnoseError = (error, connectionUri) => {
  const errMsg = error.message || '';
  const errCode = error.code || '';
  const errName = error.name || '';

  // 1. Authentication failure
  if (errMsg.includes('bad auth') || errMsg.includes('authentication failed') || errCode === 8000) {
    return {
      reason: 'Authentication Failure (Code 8000)',
      message:
        'MongoDB Atlas rejected your credentials ("bad auth: authentication failed"). ' +
        'Action required: Verify the database username and password in MONGODB_URI in .env. ' +
        'Ensure the user exists in MongoDB Atlas under "Security" -> "Database Access", ' +
        'and if your password contains special characters (such as @, :, #, %), URL-encode them.',
    };
  }

  // 2. DNS / SRV Resolution Failure
  if (errMsg.includes('querySrv') || errMsg.includes('ENOTFOUND') || errCode === 'ECONNREFUSED') {
    return {
      reason: 'DNS SRV Query Refused',
      message:
        'Local DNS resolver failed to resolve Atlas SRV records (_mongodb._tcp). ' +
        'Action required: Configure public DNS (e.g., 8.8.8.8, 1.1.1.1) or use a standard non-SRV connection string.',
    };
  }

  // 3. Network Access / IP Whitelist Denial
  if (
    errMsg.includes('whitelist') ||
    errMsg.includes('IP') ||
    (errName === 'MongoServerSelectionError' && errMsg.includes('timed out'))
  ) {
    return {
      reason: 'Network Access / IP Not Whitelisted',
      message:
        'Connection timed out while reaching cluster nodes. ' +
        'Action required: In MongoDB Atlas, go to "Security" -> "Network Access" and ensure your current IP address ' +
        '(or 0.0.0.0/0 for development) is added to the IP Access List.',
    };
  }

  // 4. Invalid Scheme / Syntax Error
  if (errName === 'MongoParseError') {
    return {
      reason: 'Invalid Connection String Scheme',
      message:
        'Connection string format is invalid. Mongoose expected string starting with "mongodb://" or "mongodb+srv://". ' +
        'Action required: Check MONGODB_URI in .env for duplicate prefixes or invalid characters.',
    };
  }

  // Generic fallback
  return {
    reason: errName || 'Connection Failure',
    message: `Database connection attempt failed: ${errMsg}`,
  };
};

const connectDB = async () => {
  attachEventListeners();

  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    const errorMsg = 'MONGODB_URI is not defined in environment variables.';
    lastDiagnostic = {
      reason: 'Missing Environment Variable',
      message: 'MONGODB_URI is missing in .env. Configure MONGODB_URI to connect to MongoDB Atlas or local MongoDB.',
      timestamp: new Date().toISOString(),
    };
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`[Database Configuration Failure] ${errorMsg}`);
    }
    console.warn(`[Database Warning] ${errorMsg}`);
    console.warn('[Database] Hint: Add MONGODB_URI=mongodb+srv://... in your root .env file.');
    return null;
  }

  const connectionUri = sanitizeMongoUri(rawUri);

  // If using Atlas (mongodb+srv://), configure public DNS servers to prevent local Windows/ISP SRV lookup refusals
  if (connectionUri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
      console.warn('[Database] Notice: Unable to set public DNS servers:', dnsErr.message);
    }
  }

  try {
    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 6000,
    });
    console.log(`[Database] Connected successfully to host: ${conn.connection.host}`);
    console.log(`[Database] Active database: ${conn.connection.name}`);
    lastDiagnostic = {
      reason: 'Connected',
      message: 'MongoDB database connection is active and responsive.',
      timestamp: new Date().toISOString(),
    };
    return conn;
  } catch (error) {
    const diagnosis = diagnoseError(error, connectionUri);
    lastDiagnostic = {
      reason: diagnosis.reason,
      message: diagnosis.message,
      timestamp: new Date().toISOString(),
    };

    console.warn(`\n[Database Connection Diagnostic]`);
    console.warn(`Status: Disconnected`);
    console.warn(`Diagnosis: ${diagnosis.reason}`);
    console.warn(`Action: ${diagnosis.message}\n`);
    return null;
  }
};

export const getDbConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const stateCode = mongoose.connection.readyState;
  return {
    stateCode,
    status: states[stateCode] || 'unknown',
    isConnected: stateCode === 1,
    diagnosticReason: lastDiagnostic.reason,
    diagnosticMessage: lastDiagnostic.message,
  };
};

export default connectDB;
